interface ChatwootConfig {
  apiUrl: string;
  apiToken: string;
  accountId: number;
}

interface ContactAttributes {
  funnel_stage?: string;
  product_bought?: string;
  last_purchase_date?: string;
  last_consulta_date?: string;
  is_customer?: string;
  [key: string]: string | undefined;
}

export interface CustomerContactPayload {
  name: string;
  phone?: string;
  email?: string;
  customAttributes?: ContactAttributes;
}

// Converts Brazilian phone numbers to E.164 (+55...).
// Accepts formats like: (11) 98765-4321, 11987654321, +5511987654321, etc.
// Returns undefined if the number can't be normalized to a valid BR format.
function toE164Brazil(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");

  // Already has country code
  if (digits.startsWith("55") && digits.length >= 12) {
    return `+${digits}`;
  }

  // Local number: 10 digits (landline) or 11 digits (mobile with leading 9)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  return undefined;
}

export class ChatwootService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor({ apiUrl, apiToken, accountId }: ChatwootConfig) {
    this.baseUrl = `${apiUrl.replace(/\/$/, "")}/api/v1/accounts/${accountId}`;
    this.headers = {
      "Content-Type": "application/json",
      api_access_token: apiToken,
    };
  }

  async updateContactAttributes(contactId: number, attributes: ContactAttributes): Promise<void> {
    const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ custom_attributes: attributes }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Chatwoot updateContactAttributes failed: ${response.status} ${text}`);
    }
  }

  async updateContactName(contactId: number, name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Chatwoot updateContactName failed: ${response.status} ${text}`);
    }
  }

  async addLabelToConversation(conversationId: number, labels: string[]): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/labels`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ labels }),
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Chatwoot addLabelToConversation failed: ${response.status} ${text}`);
    }
  }

  async searchContactByPhone(phone: string): Promise<{ id: number; name: string } | null> {
    const normalized = toE164Brazil(phone) ?? phone;
    const response = await fetch(`${this.baseUrl}/contacts/filter`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        payload: [{ attribute_key: "phone_number", filter_operator: "equal_to", values: [normalized], query_operator: null }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const list: unknown[] = Array.isArray(data?.payload) ? data.payload
      : Array.isArray(data?.payload?.payload) ? data.payload.payload
      : [];
    const contact = list[0] as any;
    return contact ? { id: contact.id, name: contact.name } : null;
  }

  async filterByPhone(e164: string): Promise<{ id: number; name: string } | null> {
    const response = await fetch(`${this.baseUrl}/contacts/filter`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        payload: [{ attribute_key: "phone_number", filter_operator: "equal_to", values: [e164], query_operator: null }],
      }),
    });
    if (!response.ok) {
      console.warn(`filterByPhone ${e164}: HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    // Chatwoot filter API wraps results in data.payload (array) or data.payload.payload
    const list: unknown[] = Array.isArray(data?.payload) ? data.payload
      : Array.isArray(data?.payload?.payload) ? data.payload.payload
      : [];
    console.log(`filterByPhone ${e164}: found ${list.length} contacts`);
    const contact = list[0] as any;
    return contact ? { id: contact.id, name: contact.name } : null;
  }

  async searchContactByName(name: string): Promise<{ id: number; name: string } | null> {
    const response = await fetch(
      `${this.baseUrl}/contacts/search?q=${encodeURIComponent(name)}&page=1`,
      { headers: this.headers },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const contact = data?.payload?.[0];
    return contact ? { id: contact.id, name: contact.name } : null;
  }

  async filterContactByEmail(email: string): Promise<{ id: number; name: string } | null> {
    const response = await fetch(`${this.baseUrl}/contacts/filter`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        payload: [{ attribute_key: "email", filter_operator: "equal_to", values: [email], query_operator: null }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const list: unknown[] = Array.isArray(data?.payload) ? data.payload
      : Array.isArray(data?.payload?.payload) ? data.payload.payload
      : [];
    const contact = list[0] as any;
    return contact ? { id: contact.id, name: contact.name } : null;
  }

  async createContact(payload: CustomerContactPayload): Promise<number | null> {
    const body: Record<string, unknown> = { name: payload.name };
    if (payload.phone) {
      const e164 = toE164Brazil(payload.phone);
      if (e164) body.phone_number = e164;
    }
    if (payload.email) body.email = payload.email;
    if (payload.customAttributes) body.custom_attributes = payload.customAttributes;

    const response = await fetch(`${this.baseUrl}/contacts`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Chatwoot createContact failed: ${response.status} ${text}`);
    }
    const data = await response.json();
    return data?.id ?? null;
  }

  async updateContact(contactId: number, payload: CustomerContactPayload): Promise<Record<string, unknown>> {
    // Never overwrite phone_number — Chatwoot/WhatsApp owns that field and sending
    // a different E.164 variant causes 422 "already taken" conflicts.
    const body: Record<string, unknown> = { name: payload.name };
    if (payload.email) body.email = payload.email;
    if (payload.customAttributes) body.custom_attributes = payload.customAttributes;

    const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Chatwoot updateContact failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  // Finds existing contact by phone (or email fallback), then creates or updates.
  async upsertCustomerContact(payload: CustomerContactPayload): Promise<Record<string, unknown>> {
    const existing = await this.findExistingContact(payload);
    if (existing) {
      return this.updateContact(existing.id, payload);
    }

    try {
      const id = await this.createContact(payload);
      return { id };
    } catch (err: unknown) {
      // 422 "already taken" — contact exists but lookups missed it, try name as last resort
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("422") && payload.name) {
        const found = await this.searchContactByName(payload.name);
        if (found) return this.updateContact(found.id, payload);
      }
      throw err;
    }
  }

  // Exhaustively searches for an existing contact across all known phone variants and email.
  private async findExistingContact(payload: CustomerContactPayload): Promise<{ id: number; name: string } | null> {
    if (payload.phone) {
      const e164 = toE164Brazil(payload.phone);
      if (e164) {
        // For 11-digit mobile numbers, try the old 10-digit format (without leading 9) FIRST —
        // that's the original WhatsApp contact. The new-format duplicate (with 9) was created
        // by an earlier sync run and should be ignored in favour of the real contact.
        if (e164.length === 14) {
          const without9 = `${e164.slice(0, 5)}${e164.slice(6)}`;
          const byOld = await this.filterByPhone(without9);
          if (byOld) return byOld;
        }

        // For 10-digit numbers, try with leading 9 first (same reasoning)
        if (e164.length === 13) {
          const with9 = `${e164.slice(0, 5)}9${e164.slice(5)}`;
          const byNew = await this.filterByPhone(with9);
          if (byNew) return byNew;
        }

        // Fall back to exact E.164
        const byExact = await this.filterByPhone(e164);
        if (byExact) return byExact;
      }
    }

    if (payload.email) {
      const byEmail = await this.filterContactByEmail(payload.email);
      if (byEmail) return byEmail;
    }

    return null;
  }

  async searchContactByEmail(email: string): Promise<{ id: number; name: string } | null> {
    const response = await fetch(
      `${this.baseUrl}/contacts/search?q=${encodeURIComponent(email)}&page=1`,
      { headers: this.headers },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const contact = data?.payload?.[0];
    return contact ? { id: contact.id, name: contact.name } : null;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations?page=1`, {
        headers: this.headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

