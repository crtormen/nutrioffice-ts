import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatwootService } from "./ChatwootService.js";

// ── fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

function errorResponse(status: number, body: string) {
  return Promise.resolve({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  } as Response);
}

// ── toE164Brazil (tested indirectly via createContact) ───────────────────────

describe("phone normalization → E.164", () => {
  let svc: ChatwootService;

  beforeEach(() => {
    svc = new ChatwootService({ apiUrl: "https://chat.example.com", apiToken: "tok", accountId: 1 });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 99 }), text: () => Promise.resolve("") } as Response);
  });

  afterEach(() => vi.clearAllMocks());

  it("converts local 11-digit mobile (with leading 9)", async () => {
    await svc.createContact({ name: "Ana", phone: "11987654321" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+5511987654321");
  });

  it("converts local 10-digit landline", async () => {
    await svc.createContact({ name: "Ana", phone: "1132001234" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+551132001234");
  });

  it("converts formatted Brazilian number (11) 98765-4321", async () => {
    await svc.createContact({ name: "Ana", phone: "(11) 98765-4321" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+5511987654321");
  });

  it("preserves already-E164 number +5511987654321", async () => {
    await svc.createContact({ name: "Ana", phone: "+5511987654321" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+5511987654321");
  });

  it("handles number starting with 55 and 12 digits", async () => {
    await svc.createContact({ name: "Ana", phone: "5511987654321" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+5511987654321");
  });

  it("omits phone_number when format is unrecognizable (too short)", async () => {
    await svc.createContact({ name: "Ana", phone: "9999" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBeUndefined();
  });

  it("omits phone_number when format is unrecognizable (too long)", async () => {
    await svc.createContact({ name: "Ana", phone: "999988887777666" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBeUndefined();
  });
});

// ── createContact ────────────────────────────────────────────────────────────

describe("ChatwootService.createContact", () => {
  let svc: ChatwootService;

  beforeEach(() => {
    svc = new ChatwootService({ apiUrl: "https://chat.example.com/", apiToken: "tok", accountId: 7 });
  });

  afterEach(() => vi.clearAllMocks());

  it("posts to the correct URL and returns the contact id", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 42 }));
    const id = await svc.createContact({ name: "João", email: "j@example.com" });
    expect(id).toBe(42);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://chat.example.com/api/v1/accounts/7/contacts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("includes email and custom_attributes when provided", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 1 }));
    await svc.createContact({ name: "João", email: "j@x.com", customAttributes: { is_customer: "true" } });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.email).toBe("j@x.com");
    expect(body.custom_attributes.is_customer).toBe("true");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(422, '{"message":"invalid"}'));
    await expect(svc.createContact({ name: "Bad" })).rejects.toThrow("422");
  });
});

// ── updateContact ────────────────────────────────────────────────────────────

describe("ChatwootService.updateContact", () => {
  let svc: ChatwootService;

  beforeEach(() => {
    svc = new ChatwootService({ apiUrl: "https://chat.example.com", apiToken: "tok", accountId: 1 });
  });

  afterEach(() => vi.clearAllMocks());

  it("patches the correct contact URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);
    await svc.updateContact(55, { name: "Maria" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://chat.example.com/api/v1/accounts/1/contacts/55",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("normalizes phone to E.164 on update", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);
    await svc.updateContact(55, { name: "Maria", phone: "21912345678" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+5521912345678");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(404, "not found"));
    await expect(svc.updateContact(1, { name: "X" })).rejects.toThrow("404");
  });
});

// ── upsertCustomerContact ────────────────────────────────────────────────────

describe("ChatwootService.upsertCustomerContact", () => {
  let svc: ChatwootService;

  beforeEach(() => {
    svc = new ChatwootService({ apiUrl: "https://chat.example.com", apiToken: "tok", accountId: 1 });
  });

  afterEach(() => vi.clearAllMocks());

  it("updates existing contact when found by phone", async () => {
    // searchContactByPhone → returns existing
    mockFetch.mockResolvedValueOnce(okJson({ payload: [{ id: 10, name: "Old" }] }));
    // updateContact
    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);

    const id = await svc.upsertCustomerContact({ name: "New", phone: "11912345678" });

    expect(id).toBe(10);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const updateCall = mockFetch.mock.calls[1];
    expect(updateCall[0]).toContain("/contacts/10");
    expect(updateCall[1].method).toBe("PATCH");
  });

  it("creates contact when phone search returns nothing", async () => {
    // searchContactByPhone → empty
    mockFetch.mockResolvedValueOnce(okJson({ payload: [] }));
    // createContact
    mockFetch.mockResolvedValueOnce(okJson({ id: 77 }));

    const id = await svc.upsertCustomerContact({ name: "New", phone: "11912345678" });

    expect(id).toBe(77);
    const createCall = mockFetch.mock.calls[1];
    expect(createCall[1].method).toBe("POST");
  });

  it("falls back to email search when no phone provided", async () => {
    // searchContactByEmail → returns existing
    mockFetch.mockResolvedValueOnce(okJson({ payload: [{ id: 20, name: "Old" }] }));
    // updateContact
    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") } as Response);

    const id = await svc.upsertCustomerContact({ name: "New", email: "x@test.com" });

    expect(id).toBe(20);
  });

  it("creates contact when neither phone nor email finds a match", async () => {
    // searchContactByEmail → empty
    mockFetch.mockResolvedValueOnce(okJson({ payload: [] }));
    // createContact
    mockFetch.mockResolvedValueOnce(okJson({ id: 88 }));

    const id = await svc.upsertCustomerContact({ name: "New", email: "x@test.com" });
    expect(id).toBe(88);
  });
});

// ── verifyConnection ─────────────────────────────────────────────────────────

describe("ChatwootService.verifyConnection", () => {
  let svc: ChatwootService;

  beforeEach(() => {
    svc = new ChatwootService({ apiUrl: "https://chat.example.com", apiToken: "tok", accountId: 1 });
  });

  afterEach(() => vi.clearAllMocks());

  it("returns true when Chatwoot responds ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);
    expect(await svc.verifyConnection()).toBe(true);
  });

  it("returns false when Chatwoot responds with error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false } as Response);
    expect(await svc.verifyConnection()).toBe(false);
  });

  it("returns false when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect(await svc.verifyConnection()).toBe(false);
  });
});
