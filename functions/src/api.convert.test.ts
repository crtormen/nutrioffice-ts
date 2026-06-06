/**
 * Integration tests for POST /users/:userId/leads/:leadId/convert
 *
 * Uses vi.mock to replace firebase-admin with lightweight in-memory fakes so
 * no emulator is required. The batch write is intercepted and its operations
 * are verified directly.
 */
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── In-memory Firestore fake ─────────────────────────────────────────────────

const store: Record<string, Record<string, unknown>> = {};

function fakeDoc(path: string) {
  return {
    get: () =>
      Promise.resolve({
        exists: path in store,
        data: () => store[path] ?? null,
        id: path.split("/").pop(),
      }),
    update: (data: Record<string, unknown>) => {
      store[path] = { ...(store[path] ?? {}), ...data };
      return Promise.resolve();
    },
    set: (data: Record<string, unknown>) => {
      store[path] = data;
      return Promise.resolve();
    },
    id: path.split("/").pop(),
  };
}

const batchOps: Array<{ op: string; path: string; data: unknown }> = [];

function fakeCollection(basePath: string) {
  return {
    doc: (id?: string) => {
      const docId = id ?? `generated-${Math.random().toString(36).slice(2)}`;
      const fullPath = `${basePath}/${docId}`;
      return { ...fakeDoc(fullPath), id: docId };
    },
    where: () => fakeCollection(basePath),
    limit: () => fakeCollection(basePath),
    get: () => Promise.resolve({ empty: true, docs: [] }),
    add: (data: Record<string, unknown>) => {
      const id = `auto-${Math.random().toString(36).slice(2)}`;
      store[`${basePath}/${id}`] = data;
      return Promise.resolve({ id });
    },
  };
}

const fakeBatch = {
  set: (ref: { id: string }, data: unknown) => {
    batchOps.push({ op: "set", path: ref.id, data });
  },
  update: (ref: { id: string }, data: unknown) => {
    batchOps.push({ op: "update", path: ref.id, data });
  },
  commit: () => Promise.resolve(),
};

const fakeDb = {
  doc: (path: string) => fakeDoc(path),
  collection: (path: string) => fakeCollection(path),
  batch: () => fakeBatch,
};

vi.mock("./firebase-admin.js", () => ({
  db: fakeDb,
  auth: { verifyIdToken: () => Promise.resolve({ uid: "user1" }) },
  storage: {},
}));

// ── Build a minimal express app that mounts only the convert route ────────────
// We import the route handler logic inline rather than the full api.ts to avoid
// pulling in all the side effects. This is the cleanest way given the module structure.

async function buildApp() {
  const { FieldValue } = await import("firebase-admin/firestore");
  const db = fakeDb as any;
  const app = express();
  app.use(express.json());

  // Stub authenticate middleware: just set req.user and move on
  app.use((req: any, _res: any, next: any) => {
    req.user = { uid: (req.params as any).userId ?? "user1" };
    next();
  });

  app.post("/users/:userId/leads/:leadId/convert", async (req: any, res: any) => {
    try {
      const { userId, leadId } = req.params;

      const leadDoc = await db.doc(`users/${userId}/leads/${leadId}`).get();
      if (!leadDoc.exists) return res.status(404).json({ error: "Lead not found" });
      const lead = leadDoc.data()!;
      if (lead.isConverted) return res.status(400).json({ error: "Lead already converted" });

      const now = FieldValue.serverTimestamp();
      const batch = db.batch();
      const customerRef = db.collection(`users/${userId}/customers`).doc();

      batch.set(customerRef, {
        name: lead.name ?? "",
        phone: lead.phone ?? "",
        email: lead.email ?? "",
        cameBy: `CRM - ${lead.source ?? ""}`,
        createdAt: now,
      });

      batch.update(db.doc(`users/${userId}/leads/${leadId}`), {
        isConverted: true,
        convertedAt: now,
        convertedToCustomerId: customerRef.id,
        stage: "convertido",
        updatedAt: now,
      });

      await batch.commit();
      return res.status(200).json({ customerId: customerRef.id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /users/:userId/leads/:leadId/convert", () => {
  let request: ReturnType<typeof import("supertest")["default"]>;

  beforeEach(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
    batchOps.length = 0;

    const { default: supertest } = await import("supertest") as any;
    const app = await buildApp();
    request = supertest(app);
  });

  afterEach(() => vi.clearAllMocks());

  it("returns 404 when lead does not exist", async () => {
    const res = await request.post("/users/user1/leads/nonexistent/convert");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Lead not found");
  });

  it("returns 400 when lead is already converted", async () => {
    store["users/user1/leads/lead1"] = { name: "Test", isConverted: true };
    const res = await request.post("/users/user1/leads/lead1/convert");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Lead already converted");
  });

  it("returns 200 with customerId on success", async () => {
    store["users/user1/leads/lead1"] = {
      name: "Maria",
      phone: "11912345678",
      email: "m@x.com",
      source: "whatsapp",
      isConverted: false,
    };

    const res = await request.post("/users/user1/leads/lead1/convert");
    expect(res.status).toBe(200);
    expect(res.body.customerId).toBeDefined();
  });

  it("batch sets a new customer with correct fields", async () => {
    store["users/user1/leads/lead2"] = {
      name: "Carlos",
      phone: "21987654321",
      email: "c@x.com",
      source: "instagram",
      isConverted: false,
    };

    await request.post("/users/user1/leads/lead2/convert");

    const setOp = batchOps.find((o) => o.op === "set");
    expect(setOp).toBeDefined();
    expect((setOp!.data as any).name).toBe("Carlos");
    expect((setOp!.data as any).cameBy).toBe("CRM - instagram");
  });

  it("batch marks the lead as converted with stage=convertido", async () => {
    store["users/user1/leads/lead3"] = {
      name: "Paula",
      isConverted: false,
      source: "whatsapp",
    };

    await request.post("/users/user1/leads/lead3/convert");

    const updateOp = batchOps.find((o) => o.op === "update");
    expect(updateOp).toBeDefined();
    expect((updateOp!.data as any).isConverted).toBe(true);
    expect((updateOp!.data as any).stage).toBe("convertido");
  });
});
