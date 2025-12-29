import { type ClassValue, clsx } from "clsx";
import { differenceInCalendarYears, parse } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined) {
  if (!name) return;

  const rgx = /(\p{L}{1})\p{L}+/gu;

  const initials = [...name.matchAll(rgx)];

  return (
    (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
  ).toUpperCase();
}

export const dateInString = (date: Timestamp | string | undefined) => {
  if (!date) return "";

  // Handle ISO string dates
  if (typeof date === 'string') {
    try {
      const parsedDate = new Date(date);
      return dateFormatter.format(parsedDate);
    } catch {
      return date;
    }
  }

  // Check if it has toDate method (Firestore Timestamp)
  if (date && typeof date.toDate === 'function') {
    return dateFormatter.format(date.toDate());
  }

  return "";
};

export const dateFormatter = new Intl.DateTimeFormat("pt-BR");

export const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const calculateAge = (birthday: string | undefined) => {
  if (!birthday) return 0;
  const birthDate = new Date(parse(birthday, "dd/MM/yyyy", new Date()));
  const age = differenceInCalendarYears(new Date(), birthDate);

  return age;
};

/**
 * Calculate installment due date from payment date
 * Handles edge cases where target day doesn't exist in month (e.g., Feb 31 → Mar 1)
 */
export const calculateInstallmentDueDate = (
  paymentDate: Date,
  monthsToAdd: number
): Date => {
  const targetDate = new Date(paymentDate);
  const originalDay = targetDate.getDate();

  targetDate.setMonth(targetDate.getMonth() + monthsToAdd);

  // Handle edge case: if day doesn't exist in target month, use 1st of next month
  if (targetDate.getDate() !== originalDay) {
    targetDate.setDate(1);
  }

  return targetDate;
};

/**
 * Check if installment is overdue considering grace period
 */
export const isInstallmentOverdue = (
  dueDate: string,
  gracePeriodDays: number = 3
): boolean => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateWithGrace = new Date(due);
  dueDateWithGrace.setDate(dueDateWithGrace.getDate() + gracePeriodDays);
  dueDateWithGrace.setHours(0, 0, 0, 0);

  return dueDateWithGrace < today;
};

/**
 * Format date to YYYY-MM-DD for HTML5 date input
 */
export const formatDateForInput = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
