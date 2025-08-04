

export interface Ingredient {
  id: string;
  name: string;
  amount: number; 
  unit: string;   
  isOptional?: boolean | null;
  notes?: string | null;
  isHeading?: boolean | null;
}

export interface InstructionStep {
  id: string;
  text: string;
  imageUrl?: string | null;
  isHeading?: boolean | null;
}

export interface Recipe {
  id: string;
  name: string;
  source: string | null;
  prepTime: string;
  cookTime: string | null;
  servings: number;
  servingUnit: string;
  freezable: boolean;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  imageUrl?: string | null;
  tags?: string[] | null;
  notes?: string | null;
}

export interface ShoppingListItem {
  id: string; 
  name: string;
  amount: number;
  unit: string;
  originalIngredientId?: string | null; 
  recipeId?: string | null; 
  recipeName?: string | null; 
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}
