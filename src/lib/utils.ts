
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  // More robust unique ID generator
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}


export function getDisplayUnit(amount: number, unit: string): string {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  
  // Always use 'גרם' for grams
  if (['גרם', 'גרמים'].includes(lowerUnit)) return 'גרם';

  if (amount === 1 || (amount > 0 && amount < 1) || (amount < 0 && amount > -1) ) { // Handle singular for 1, 0.x, -0.x
    if (['כוסות'].includes(lowerUnit)) return 'כוס';
    if (['כפיות'].includes(lowerUnit)) return 'כפית';
    if (['כפות'].includes(lowerUnit)) return 'כף';
    if (['שקיות', 'שקית'].includes(lowerUnit)) return 'שקית';
    if (['חבילות', 'חבילת'].includes(lowerUnit)) return 'חבילה';
    if (['שיניים', 'שיני'].includes(lowerUnit)) return 'שן';
    if (['גביעים', 'גביעי'].includes(lowerUnit)) return 'גביע';
    return unit; // Return original if no specific singular form
  } else { // Handle plural for amount > 1, amount = 0, amount <= -1
    if (['כוס'].includes(lowerUnit)) return 'כוסות';
    if (['כפית'].includes(lowerUnit)) return 'כפיות';
    if (['כף'].includes(lowerUnit)) return 'כפות';
    if (['שקית'].includes(lowerUnit)) return 'שקיות';
    if (['חבילה', 'חבילת'].includes(lowerUnit)) return 'חבילות';
    if (['שן', 'שיני'].includes(lowerUnit)) return 'שיניים';
    if (['גביע', 'גביעי'].includes(lowerUnit)) return 'גביעים';
    return unit;
  }
}

    

    
