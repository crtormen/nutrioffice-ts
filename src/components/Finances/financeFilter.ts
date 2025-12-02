import { IFinance } from "@/domain/entities";
import { DateRange } from "@/components/Consultas/DateRangePicker";
import { isWithinInterval } from "date-fns";

export const filterFinances = (
  finances: IFinance[],
  searchTerm: string,
  statusFilter?: "all" | "pending" | "partial" | "paid",
  dateRange?: DateRange
): IFinance[] => {
  let filtered = finances;

  // Filter by search term (customer name or services)
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((finance) => {
      // Check customer name if available (from global collection)
      const customerNameMatch = (finance as any).name?.toLowerCase().includes(term);

      // Check service names
      const servicesMatch = finance.items?.some((item) =>
        item.serviceName.toLowerCase().includes(term)
      ) || false;

      return customerNameMatch || servicesMatch;
    });
  }

  // Filter by status
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((finance) => finance.status === statusFilter);
  }

  // Filter by date range
  if (dateRange?.from || dateRange?.to) {
    filtered = filtered.filter((finance) => {
      if (!finance.createdAt) return false;

      try {
        // Parse the ISO date string to Date object
        const financeDate = new Date(finance.createdAt);

        // If only 'from' date is set
        if (dateRange.from && !dateRange.to) {
          return financeDate >= dateRange.from;
        }

        // If only 'to' date is set
        if (!dateRange.from && dateRange.to) {
          return financeDate <= dateRange.to;
        }

        // If both dates are set
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(financeDate, {
            start: dateRange.from,
            end: dateRange.to,
          });
        }

        return true;
      } catch (error) {
        console.error("Error parsing date:", finance.createdAt, error);
        return false;
      }
    });
  }

  return filtered;
};
