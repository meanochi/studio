export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
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
  instructions: string[];
  imageUrl?: string;
  tags?: string[];
}

export interface ShoppingListItem extends Ingredient {
  recipeId?: string; // Optional: to know which recipe it came from
  recipeName?: string; // Optional
}
