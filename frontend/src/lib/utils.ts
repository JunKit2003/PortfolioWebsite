import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Shared page gutter and max width. */
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8"
