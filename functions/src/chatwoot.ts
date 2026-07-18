import * as crypto from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";

import { db } from "./firebase-admin.js";
import { ChatwootService, CustomerContactPayload } from "./services/ChatwootService.js";

// ── Shared helper ────────────────────────────────────────────────────────────

async function getChatwootService(userId: string): Promise<ChatwootService | null> {
  const snap = await db.doc(`users/${userId}/settings/crm`).get();
  const s = snap.data();
  if (!s?.chatwootApiUrl || !s?.chatwootApiToken || !s?.chatwootAccountId) return null;
  return new ChatwootService({
    apiUrl: s.chatwootApiUrl,
    apiToken: s.chatwootApiToken,
    accountId: s.chatwootAccountId,
  });
}

function buildCustomerContactPayload(
  data: FirebaseFirestore.DocumentData,
  lastPurchaseDate?: Date,
): CustomerContactPayload {
  const attrs: Record<string, string> = {
    is_customer: "true",
    funnel_stage: "vendido",
    product_bought: "consultoria",
  };
  if (data.lastConsultaDate instanceof Timestamp) {
    attrs.last_consulta_date = data.lastConsultaDate.toDate().toISOString().split("T")[0];
  }
  if (lastPurchaseDate) {
    attrs.last_purchase_date = lastPurchaseDate.toISOString().split("T")[0];
  }
  return {
    name: data.name ?? "Sem nome",
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    customAttributes: attrs,
  };
}

// ── Inbound: Chatwoot → NutriOffice ─────────────────────────────────────────

export const chatwootWebhook = onRequest(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const userId = req.query.userId as string;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "Missing userId query param" });
      return;
    }

    // Verify HMAC-SHA1 signature if secret is configured
    const webhookSecret = process.env.CHATWOOT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-chatwoot-signature"] as string;
      if (!signature) {
        res.status(401).send("Missing signature");
        return;
      }
      const body =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha1", webhookSecret)
        .update(body)
        .digest("hex");
      if (signature !== expected) {
        res.status(401).send("Invalid signature");
        return;
      }
    }

    try {
      const payload = req.body;
      const event: string = payload.event;
      console.log("chatwootWebhook: received event", event, "userId:", req.query.userId);

      if (!["conversation_created", "contact_created"].includes(event)) {
        console.log("chatwootWebhook: event ignored", event);
        res.status(200).json({ message: "Event ignored" });
        return;
      }

      console.log("PAYLOAD: ", payload);
      // contact_created: contact is at payload.contact
      // conversation_created / conversation_updated: contact is at payload.meta.sender, conversation is the payload itself
      const contact = payload.contact ?? payload.meta?.sender;
      const conversation = payload.conversation ?? (payload.id ? payload : undefined);

      if (!contact?.id) {
        console.log("chatwootWebhook: no contact found in payload");
        res.status(200).json({ message: "No contact in payload" });
        return;
      }

      // Read CRM settings to get default funnel and inbox filters
      const settingsDoc = await db
        .doc(`users/${userId}/settings/crm`)
        .get();
      const crmSettings = settingsDoc.data();

      // Skip if this inbox is configured but not tracked
      const inboxId: number | undefined = conversation?.inbox_id ?? payload.inbox_id;
      if (inboxId != null && crmSettings?.inboxSettings) {
        const inboxSetting = crmSettings.inboxSettings[inboxId];
        if (inboxSetting && inboxSetting.tracked === false) {
          console.log("chatwootWebhook: inbox", inboxId, "not tracked, skipping");
          res.status(200).json({ message: "Inbox not tracked" });
          return;
        }
      }

      const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
      const inboxFunnelId = inboxId != null
        ? (crmSettings?.inboxSettings?.[inboxId]?.funnelId ?? defaultFunnelId)
        : defaultFunnelId;

      const firstStageId = (() => {
        const funnel = crmSettings?.funnels?.[inboxFunnelId];
        if (!funnel?.stages?.length) return "novo-lead";
        return [...funnel.stages].sort((a: any, b: any) => a.order - b.order)[0].id;
      })();

      // Upsert lead: find by chatwootContactId scoped to this funnel
      const leadsRef = db.collection(`users/${userId}/leads`);
      const existing = await leadsRef
        .where("chatwootContactId", "==", contact.id)
        .where("funnelId", "==", inboxFunnelId)
        .limit(1)
        .get();

      if (!existing.empty) {
        // Update timestamps only
        await existing.docs[0].ref.update({
          updatedAt: FieldValue.serverTimestamp(),
          ...(contact.name && { name: contact.name }),
          ...(contact.phone_number && { phone: contact.phone_number }),
          ...(contact.email && { email: contact.email }),
        });
      } else {
        const phone: string | undefined = contact.phone_number ?? undefined;
        let existingCustomerId: string | undefined;
        let isConverted = false;

        if (phone) {
          const customerSnap = await db
            .collection(`users/${userId}/customers`)
            .where("phone", "==", phone)
            .limit(1)
            .get();
          if (!customerSnap.empty) {
            const customerData = customerSnap.docs[0].data();

            // Rule 1: Active customers are never re-entered into a funnel.
            // Only inactive customers (isActive === false) may re-enter.
            if (customerData.isActive !== false) {
              console.log("chatwootWebhook: active customer, skipping lead creation", contact.id);
              const chatwoot = await getChatwootService(userId);
              if (chatwoot) {
                try {
                  await chatwoot.updateContact(contact.id, buildCustomerContactPayload(customerData));
                } catch (err) {
                  console.error("chatwootWebhook: failed to enrich customer contact", err);
                }
              }
              res.status(200).json({ ok: true, skipped: "active_customer" });
              return;
            }

            // Inactive customer: re-enter funnel as a converted lead
            existingCustomerId = customerSnap.docs[0].id;
            isConverted = true;

            const chatwoot = await getChatwootService(userId);
            if (chatwoot) {
              try {
                await chatwoot.updateContact(contact.id, buildCustomerContactPayload(customerData));
              } catch (err) {
                console.error("chatwootWebhook: failed to enrich customer contact", err);
              }
            }
          }
        }

        // Rule: skip if the resolved funnel only accepts leads via stage transitions
        const inboxFunnelConfig = crmSettings?.funnels?.[inboxFunnelId];
        if (inboxFunnelConfig?.entryMode === "stage_trigger") {
          console.log("chatwootWebhook: funnel", inboxFunnelId, "is stage_trigger only, skipping");
          res.status(200).json({ ok: true, skipped: "stage_trigger_only_funnel" });
          return;
        }

        await leadsRef.add({
          name: contact.name ?? "Sem nome",
          phone: phone,
          email: contact.email ?? undefined,
          chatwootContactId: contact.id,
          chatwootConversationId: conversation?.id ?? undefined,
          chatwootInboxId: conversation?.inbox_id ?? undefined,
          funnelId: inboxFunnelId,
          stage: isConverted ? "convertido" : firstStageId,
          tags: isConverted ? ["cliente"] : [],
          source: "whatsapp",
          isConverted,
          ...(isConverted && existingCustomerId
            ? { convertedToCustomerId: existingCustomerId, convertedAt: FieldValue.serverTimestamp() }
            : {}),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      console.error("chatwootWebhook error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// ── Outbound: NutriOffice → Chatwoot ────────────────────────────────────────

export const onLeadWritten = onDocumentWritten(
  { document: "users/{userId}/leads/{leadId}" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!after) return; // lead deleted

    const userId = event.params.userId;
    const settingsSnap = await db.doc(`users/${userId}/settings/crm`).get();
    const settings = settingsSnap.data();

    // ── Section A: Chatwoot sync (runs only when integration is configured) ──

    if (settings?.chatwootApiUrl && settings?.chatwootApiToken && settings?.chatwootAccountId) {
      const chatwoot = new ChatwootService({
        apiUrl: settings.chatwootApiUrl,
        apiToken: settings.chatwootApiToken,
        accountId: settings.chatwootAccountId,
      });

      const contactId: number | undefined = after.chatwootContactId;
      const conversationId: number | undefined = after.chatwootConversationId;

      if (contactId) {
        try {
          const attributes: Record<string, string | undefined> = {};

          // Stage changed
          if (!before || before.stage !== after.stage) {
            attributes.funnel_stage = after.stage;
            if (conversationId) {
              await chatwoot.addLabelToConversation(conversationId, [after.stage]);
            }
          }

          // Converted
          if (after.isConverted && (!before || !before.isConverted)) {
            attributes.funnel_stage = "convertido";
            attributes.product_bought = after.interest ?? undefined;
            if (after.convertedAt instanceof Timestamp) {
              attributes.last_purchase_date = after.convertedAt.toDate().toISOString().split("T")[0];
            }
          }

          // Last appointment date changed
          if (after.lastAppointmentDate && (!before || before.lastAppointmentDate !== after.lastAppointmentDate)) {
            const d = after.lastAppointmentDate instanceof Timestamp
              ? after.lastAppointmentDate.toDate().toISOString().split("T")[0]
              : String(after.lastAppointmentDate);
            attributes.last_appointment_date = d;
          }

          if (Object.keys(attributes).length > 0) {
            await chatwoot.updateContactAttributes(contactId, attributes);
          }

          // Name changed
          if (!before || before.name !== after.name) {
            await chatwoot.updateContactName(contactId, after.name);
          }
        } catch (err) {
          console.error("onLeadWritten Chatwoot sync error:", err);
        }
      }
    }

    // ── Section B: Stage transition rules (runs regardless of Chatwoot config) ──

    // Fire when an existing lead moves to a new stage, OR when a new "re-entry"
    // lead is created already at a converted stage (inactive customer returning via webhook).
    // The isConverted guard prevents newly trigger-created leads (isConverted=false) from
    // cascading and causing an infinite loop.
    const movedToStage = before && after.stage && before.stage !== after.stage;
    const createdAtConvertedStage = !before && after.isConverted === true && after.stage;

    if (!movedToStage && !createdAtConvertedStage) return;

    const funnelId: string = after.funnelId;
    const stageRules: Array<{ stageId: string; targetFunnelId: string }> =
      settings?.funnels?.[funnelId]?.stageRules ?? [];
    const matchingRules = stageRules.filter((r) => r.stageId === after.stage);
    if (matchingRules.length === 0) return;

    const leadsRef = db.collection(`users/${userId}/leads`);

    for (const rule of matchingRules) {
      const targetFunnel = settings?.funnels?.[rule.targetFunnelId];
      if (!targetFunnel) {
        console.warn(`onLeadWritten: stageRule references unknown targetFunnelId ${rule.targetFunnelId}`);
        continue;
      }

      // Duplicate check 1: by chatwootContactId in target funnel
      if (after.chatwootContactId != null) {
        const dup = await leadsRef
          .where("chatwootContactId", "==", after.chatwootContactId)
          .where("funnelId", "==", rule.targetFunnelId)
          .limit(1)
          .get();
        if (!dup.empty) {
          console.log(`onLeadWritten: duplicate by chatwootContactId in ${rule.targetFunnelId}, skipping`);
          continue;
        }
      }

      // Duplicate check 2: by phone in target funnel (fallback for leads without chatwootContactId)
      if (after.phone) {
        const dup = await leadsRef
          .where("phone", "==", after.phone)
          .where("funnelId", "==", rule.targetFunnelId)
          .limit(1)
          .get();
        if (!dup.empty) {
          console.log(`onLeadWritten: duplicate by phone in ${rule.targetFunnelId}, skipping`);
          continue;
        }
      }

      const targetFirstStageId = [...(targetFunnel.stages ?? [])]
        .sort((a: any, b: any) => a.order - b.order)[0]?.id ?? "novo-lead";

      await leadsRef.add({
        name: after.name ?? "Sem nome",
        phone: after.phone ?? undefined,
        email: after.email ?? undefined,
        chatwootContactId: after.chatwootContactId ?? undefined,
        chatwootConversationId: after.chatwootConversationId ?? undefined,
        chatwootInboxId: after.chatwootInboxId ?? undefined,
        funnelId: rule.targetFunnelId,
        stage: targetFirstStageId,
        tags: after.tags ?? [],
        source: after.source ?? "outro",
        interest: after.interest ?? undefined,
        notes: after.notes ?? undefined,
        isConverted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`onLeadWritten: created triggered lead in ${rule.targetFunnelId} from ${event.params.leadId}`);
    }
  },
);

// ── Outbound: customer changes → Chatwoot contact ───────────────────────────

export const onCustomerWritten = onDocumentWritten(
  { document: "users/{userId}/customers/{customerId}" },
  async (event) => {
    const after = event.data?.after.data();
    if (!after) return; // deleted — nothing to do

    const userId = event.params.userId;
    const chatwoot = await getChatwootService(userId);
    if (!chatwoot) return;

    try {
      await chatwoot.upsertCustomerContact(buildCustomerContactPayload(after));
    } catch (err) {
      console.error("onCustomerWritten Chatwoot sync error:", err);
    }
  },
);

// ── Bulk sync: all customers → Chatwoot contacts ─────────────────────────────
// Separate function with extended timeout; processes contacts in parallel
// batches of 5 to stay well within Chatwoot rate limits.

export const syncCustomersToChatwoot = onRequest(
  { timeoutSeconds: 540, memory: "512MiB", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Verify Bearer token
    const match = (req.headers.authorization ?? "").match(/^Bearer (.+)$/);
    if (!match) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { getAuth } = await import("firebase-admin/auth");
    let userId: string;
    try {
      const decoded = await getAuth().verifyIdToken(match[1]);
      userId = decoded.uid;
      // Ensure the userId in the body matches the token
      const bodyUserId: string | undefined = req.body?.userId;
      if (bodyUserId && bodyUserId !== userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    } catch {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const chatwoot = await getChatwootService(userId);
    if (!chatwoot) {
      res.status(400).json({ error: "Chatwoot integration not configured" });
      return;
    }

    const nameFilter: string = (req.body?.name ?? "").trim().toLowerCase();

    const customersSnap = await db.collection(`users/${userId}/customers`).get();
    let synced = 0;
    let failed = 0;
    let firstError: string | undefined;
    let firstUpdateResponse: Record<string, unknown> | undefined;

    // Process in parallel batches of 5
    const BATCH = 5;
    const docs = customersSnap.docs.filter((doc) => {
      const d = doc.data();
      if (!d.name && !d.phone && !d.email) return false;
      if (nameFilter && !String(d.name ?? "").toLowerCase().includes(nameFilter)) return false;
      return true;
    });

    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (doc) => {
          const data = doc.data();

          // Fetch all finances from the customer's own subcollection.
          // Old records have no status field — treat them as paid if pago >= total,
          // or if pago > 0 (partial payment also counts as a purchase).
          const financeSnap = await db
            .collection(`users/${userId}/customers/${doc.id}/finances`)
            .get();

          let lastPurchaseDate: Date | undefined;
          for (const fDoc of financeSnap.docs) {
            const d = fDoc.data();
            const isPaid =
              d.status === "paid" ||
              (!d.status && d.pago != null && d.total != null && d.pago >= d.total) ||
              (!d.status && d.pago > 0);
            if (!isPaid) continue;
            const ts = d.createdAt;
            if (ts instanceof Timestamp) {
              const date = ts.toDate();
              if (!lastPurchaseDate || date > lastPurchaseDate) lastPurchaseDate = date;
            }
          }

          const result = await chatwoot.upsertCustomerContact(buildCustomerContactPayload(data, lastPurchaseDate));
          if (!firstUpdateResponse) firstUpdateResponse = result;
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") synced++;
        else {
          const msg = r.reason?.message ?? String(r.reason);
          console.error("syncCustomersToChatwoot batch error:", msg);
          if (!firstError) firstError = msg;
          failed++;
        }
      }
      // Small pause between batches to respect rate limits
      if (i + BATCH < docs.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    res.status(200).json({ total: synced + failed, synced, failed, ...(firstError && { firstError }), ...(firstUpdateResponse && { firstUpdateResponse }) });
  },
);

