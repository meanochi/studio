import { z } from 'zod';

export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "שם הרכיב נדרש"),
  amount: z.coerce.number().min(0.01, "הכמות חייבת להיות חיובית"),
  unit: z.string().min(1, "יחידת מידה נדרשת"),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "שם המתכון נדרש").max(100, "שם המתכון ארוך מדי"),
  source: z.string().max(100, "מקור ארוך מדי").optional(),
  prepTime: z.string().min(1, "זמן הכנה נדרש").max(50, "זמן הכנה ארוך מדי"),
  cookTime: z.string().max(50, "זמן בישול ארוך מדי").optional(),
  servings: z.coerce.number().int().min(1, "מספר המנות חייב להיות לפחות 1"),
  servingUnit: z.string().min(1, "יחידת מידה למנה נדרשת").max(30, "יחידת מידה למנה ארוכה מדי"),
  freezable: z.boolean().default(false),
  ingredients: z.array(ingredientSchema).min(1, "נדרש לפחות רכיב אחד"),
  instructions: z.array(z.string().min(1, "שלב בהוראות אינו יכול להיות ריק")).min(1, "נדרש לפחות שלב אחד בהוראות"),
  imageUrl: z.string().optional(), // Allow data URIs and standard URLs, or empty string
  tags: z.array(z.string().min(1).max(30)).optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type IngredientFormData = z.infer<typeof ingredientSchema>;
