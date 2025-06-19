import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getDisplayUnit(amount: number, unit: string): string {
  if (amount <= 1) {
    if (unit === 'כוסות') return 'כוס';
    if (unit === 'כפיות') return 'כפית';
    if (unit === 'כפות') return 'כף';
    if (unit === 'גרמים') return 'גרם';
    // Add more singularization rules as needed
    // For units like ק"ג or מ"ל, they often don't change or singularization is complex
    // So, we'll return the original unit if no simple rule applies
  }
  // Ensure common units are plural if amount > 1 and user entered singular
  if (amount > 1) {
    if (unit === 'כוס') return 'כוסות';
    if (unit === 'כפית') return 'כפיות';
    if (unit === 'כף') return 'כפות';
    if (unit === 'גרם') return 'גרמים';
  }
  return unit;
}
