import { matchSorter } from "match-sorter";
import { Row } from "@tanstack/react-table";

import { CustomerData } from "./columns";

// Remove all non-numeric characters
const normalizeToNumbers = (value: string): string => value.replace(/\D/g, "");

export const customerFuzzyFilter = (
  row: Row<CustomerData>,
  columnId: string,
  filterValue: string,
): boolean => {
  if (!filterValue) return true;

  const searchableFields: (keyof CustomerData)[] = [
    "name",
    "email",
    "phone",
    "cpf",
  ];

  // Get values from all searchable fields using row.original
  const values = searchableFields.map((field) => {
    const value = String(row.original[field] || "");
    // Normalize phone and CPF to only numbers for easier searching
    if (field === "cpf" || field === "phone") {
      return normalizeToNumbers(value);
    }
    return value;
  });

  // Normalize filter to only numbers if it contains any digits
  const normalizedFilter = /\d/.test(filterValue)
    ? normalizeToNumbers(filterValue)
    : filterValue;

  // Use matchSorter to check if any value matches
  const matches = matchSorter(values, normalizedFilter, {
    threshold: matchSorter.rankings.CONTAINS,
  });

  return matches.length > 0;
};
