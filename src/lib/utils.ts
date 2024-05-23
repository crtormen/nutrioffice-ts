import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined) {
  if (!name) return

  const rgx = /(\p{L}{1})\p{L}+/gu

  const initials = [...name.matchAll(rgx)] || []

  return (
    (initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')
  ).toUpperCase()
}

export const dateInString = (date: Timestamp | undefined) => {
  return date ? dateFormatter.format(date.toDate()) : ''
}

export const dateFormatter = new Intl.DateTimeFormat('pt-BR')

export const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
