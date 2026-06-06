import { Row } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { CustomerData } from "./columns";
import { customerFuzzyFilter } from "./customerFilter";

// ── Helper ───────────────────────────────────────────────────────────────────

function makeRow(data: Partial<CustomerData>): Row<CustomerData> {
  return {
    original: {
      id: "1",
      name: undefined,
      email: undefined,
      phone: undefined,
      cpf: undefined,
      credits: undefined,
      ...data,
    },
  } as unknown as Row<CustomerData>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("customerFuzzyFilter", () => {
  describe("empty filter", () => {
    it("returns true for any row when filter is empty string", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Ana" }), "name", "")).toBe(true);
    });
  });

  describe("name matching", () => {
    it("matches exact name", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Maria Silva" }), "name", "Maria Silva")).toBe(true);
    });

    it("matches partial name (substring)", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Maria Silva" }), "name", "Maria")).toBe(true);
    });

    it("matches case-insensitively", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Maria Silva" }), "name", "maria")).toBe(true);
    });

    it("does not match unrelated name", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Carlos" }), "name", "Maria")).toBe(false);
    });

    it("matches 'Consultoria' pattern in name", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Consultoria Saúde" }), "name", "Consultoria")).toBe(true);
    });

    it("does not match row without 'Consultoria' in name", () => {
      expect(customerFuzzyFilter(makeRow({ name: "Academia Fit" }), "name", "Consultoria")).toBe(false);
    });
  });

  describe("email matching", () => {
    it("matches by email", () => {
      expect(customerFuzzyFilter(makeRow({ email: "joao@example.com" }), "email", "joao")).toBe(true);
    });

    it("does not match email that doesn't contain filter", () => {
      expect(customerFuzzyFilter(makeRow({ email: "maria@example.com" }), "email", "joao")).toBe(false);
    });
  });

  describe("phone matching", () => {
    it("matches phone by digits only (strips formatting)", () => {
      expect(customerFuzzyFilter(makeRow({ phone: "(11) 98765-4321" }), "phone", "11987654321")).toBe(true);
    });

    it("matches partial phone number", () => {
      expect(customerFuzzyFilter(makeRow({ phone: "11987654321" }), "phone", "98765")).toBe(true);
    });

    it("does not match wrong phone number", () => {
      expect(customerFuzzyFilter(makeRow({ phone: "11987654321" }), "phone", "21999999999")).toBe(false);
    });
  });

  describe("CPF matching", () => {
    it("matches CPF ignoring dots and dash", () => {
      expect(customerFuzzyFilter(makeRow({ cpf: "123.456.789-00" }), "cpf", "12345678900")).toBe(true);
    });

    it("matches partial CPF digits", () => {
      expect(customerFuzzyFilter(makeRow({ cpf: "123.456.789-00" }), "cpf", "456789")).toBe(true);
    });
  });

  describe("cross-field matching", () => {
    it("returns true if filter matches any field", () => {
      const row = makeRow({ name: "Carlos", email: "joao@example.com", phone: "11912345678" });
      expect(customerFuzzyFilter(row, "name", "joao")).toBe(true);
    });

    it("returns false when filter matches no field", () => {
      const row = makeRow({ name: "Carlos", email: "carlos@x.com", phone: "11900000000", cpf: "000.000.000-00" });
      expect(customerFuzzyFilter(row, "name", "zzznomatch")).toBe(false);
    });
  });

  describe("undefined field values", () => {
    it("handles undefined name gracefully", () => {
      expect(customerFuzzyFilter(makeRow({ name: undefined }), "name", "Ana")).toBe(false);
    });

    it("handles all undefined fields gracefully", () => {
      expect(customerFuzzyFilter(makeRow({}), "name", "anything")).toBe(false);
    });
  });
});
