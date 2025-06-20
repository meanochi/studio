export interface Ingredient {
  id: string;
  name: string;
  amount: number; // Kept as number, but will be optional in form for headings
  unit: string;   // Kept as string, but will be optional in form for headings
  isOptional?: boolean;
  notes?: string;
  isHeading?: boolean;
}

export interface InstructionStep {
  id: string;
  text: string;
  imageUrl?: string;
  isHeading?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  source: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  servingUnit: string;
  freezable: boolean;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  imageUrl?: string;
  tags?: string[];
}

export interface ShoppingListItem {
  id: string; // Unique ID for the shopping list entry
  name: string;
  amount: number;
  unit: string;
  originalIngredientId?: string; // Optional: to trace back to an original ingredient if needed
  recipeId?: string; 
  recipeName?: string; 
}
