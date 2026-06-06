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

      if (!["conversation_created", "conversation_updated", "contact_created"].includes(event)) {
        res.status(200).json({ message: "Event ignored" });
        return;
      }

      const contact = payload.contact;
      const conversation = payload.conversation;

      if (!contact?.id) {
        res.status(200).json({ message: "No contact in payload" });
        return;
      }

      // Read CRM settings to get default funnel
      const settingsDoc = await db
        .doc(`users/${userId}/settings/crm`)
        .get();
      const crmSettings = settingsDoc.data();
      const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
      const firstStageId = (() => {
        const funnel = crmSettings?.funnels?.[defaultFunnelId];
        if (!funnel?.stages?.length) return "novo-lead";
        return [...funnel.stages].sort((a: any, b: any) => a.order - b.order)[0].id;
      })();

      // Upsert lead: find by chatwootContactId
      const leadsRef = db.collection(`users/${userId}/leads`);
      const existing = await leadsRef
        .where("chatwootContactId", "==", contact.id)
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
        // Check if this phone belongs to an existing customer
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
            existingCustomerId = customerSnap.docs[0].id;
            isConverted = true;

            // Enrich the Chatwoot contact with customer attributes
            const chatwoot = await getChatwootService(userId);
            if (chatwoot) {
              const customerData = customerSnap.docs[0].data();
              try {
                await chatwoot.updateContact(contact.id, buildCustomerContactPayload(customerData));
              } catch (err) {
                console.error("chatwootWebhook: failed to enrich customer contact", err);
              }
            }
          }
        }

        // Create lead (converted if customer match found)
        await leadsRef.add({
          name: contact.name ?? "Sem nome",
          phone: phone,
          email: contact.email ?? undefined,
          chatwootContactId: contact.id,
          chatwootConversationId: conversation?.id ?? undefined,
          chatwootInboxId: conversation?.inbox_id ?? undefined,
          funnelId: defaultFunnelId,
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

    // Lead deleted — nothing to sync
    if (!after) return;

    // Read CRM settings for Chatwoot credentials
    const userId = event.params.userId;
    const settingsSnap = await db.doc(`users/${userId}/settings/crm`).get();
    const settings = settingsSnap.data();

    if (!settings?.chatwootApiUrl || !settings?.chatwootApiToken || !settings?.chatwootAccountId) {
      return; // Integration not configured
    }

    const chatwoot = new ChatwootService({
      apiUrl: settings.chatwootApiUrl,
      apiToken: settings.chatwootApiToken,
      accountId: settings.chatwootAccountId,
    });

    const contactId: number | undefined = after.chatwootContactId;
    const conversationId: number | undefined = after.chatwootConversationId;

    if (!contactId) return;

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

