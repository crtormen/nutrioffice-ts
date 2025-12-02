import { matchSorter } from "match-sorter";
import { Row } from "@tanstack/react-table";

import { ConsultaData } from "./columns";

export const consultaFuzzyFilter = (
  row: Row<ConsultaData>,
  columnId: string,
  filterValue: string,
): boolean => {
  if (!filterValue) return true;

  const searchableFields: (keyof ConsultaData)[] = ["name", "date", "peso"];

  // Get values from all searchable fields using row.original
  const values = searchableFields.map((field) => {
    return String(row.original[field] || "");
  });

  // Use matchSorter to check if any value matches
  const matches = matchSorter(values, filterValue, {
    threshold: matchSorter.rankings.CONTAINS,
  });

  return matches.length > 0;
};
