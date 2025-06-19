import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getDisplayUnit(amount: number, unit: string): string {
  const lowerUnit = unit.toLowerCase();
  if (amount === 1 || (amount > 0 && amount < 1) || (amount < 0 && amount > -1) ) { // Handle singular for 1, 0.x, -0.x
    if (lowerUnit === 'כוסות') return 'כוס';
    if (lowerUnit === 'כפיות') return 'כפית';
    if (lowerUnit === 'כפות') return 'כף';
    if (lowerUnit === 'גרמים') return 'גרם';
    if (lowerUnit === 'שקיות') return 'שקית';
    // Add more singularization rules as needed
  } else { // amount > 1, amount = 0, amount < -1
    if (lowerUnit === 'כוס') return 'כוסות';
    if (lowerUnit === 'כפית') return 'כפיות';
    if (lowerUnit === 'כף') return 'כפות';
    if (lowerUnit === 'גרם') return 'גרמים';
    if (lowerUnit === 'שקית') return 'שקיות';
  }
  return unit; // Return original unit if no rule applies or already correct
}
