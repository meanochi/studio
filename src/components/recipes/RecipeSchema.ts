import { z } from 'zod';

export const ingredientSchema = z.object({
  id: z.string().optional(), // Keep id for existing ingredients during edit
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name too long"),
  source: z.string().max(100, "Source too long").optional(),
  prepTime: z.string().min(1, "Prep time is required").max(50, "Prep time too long"),
  cookTime: z.string().max(50, "Cook time too long").optional(),
  servings: z.coerce.number().int().min(1, "Servings must be at least 1"),
  servingUnit: z.string().min(1, "Serving unit is required").max(30, "Serving unit too long"),
  freezable: z.boolean().default(false),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
  instructions: z.array(z.string().min(1, "Instruction step cannot be empty")).min(1, "At least one instruction step is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  tags: z.array(z.string().min(1).max(30)).optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type IngredientFormData = z.infer<typeof ingredientSchema>;
