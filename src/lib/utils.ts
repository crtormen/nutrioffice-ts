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

  const initials = [...name.matchAll(rgx)] || [];

  return (
    (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
  ).toUpperCase();
}

export const dateInString = (date: Timestamp | undefined) => {
  return date ? dateFormatter.format(date.toDate()) : "";
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
