import { z } from 'zod';

export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "שם הרכיב או הכותרת נדרש"),
  amount: z.coerce.number().optional(), // Made optional, will be validated by superRefine
  unit: z.string().optional(), // Made optional, will be validated by superRefine
  isOptional: z.boolean().optional(),
  notes: z.string().max(150, "הערת הרכיב ארוכה מדי").optional(),
  isHeading: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (!data.isHeading) { // If it's a regular ingredient
    if (data.amount === undefined || data.amount === null || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "הכמות חייבת להיות חיובית עבור רכיב רגיל",
        path: ['amount'],
      });
    }
    if (!data.unit || data.unit.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "יחידת מידה נדרשת עבור רכיב רגיל",
        path: ['unit'],
      });
    }
  }
});

export const instructionStepSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "תיאור השלב או הכותרת נדרש"),
  imageUrl: z.string().optional(),
  isHeading: z.boolean().optional().default(false),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "שם המתכון נדרש").max(100, "שם המתכון ארוך מדי"),
  source: z.string().max(100, "מקור ארוך מדי").optional(),
  prepTime: z.string().min(1, "זמן הכנה נדרש").max(50, "זמן הכנה ארוך מדי"),
  cookTime: z.string().max(50, "זמן בישול ארוך מדי").optional(),
  servings: z.coerce.number().int().min(1, "מספר המנות חייב להיות לפחות 1"),
  servingUnit: z.string().min(1, "יחידת מידה למנה נדרשת").max(30, "יחידת מידה למנה ארוכה מדי"),
  freezable: z.boolean().default(false),
  ingredients: z.array(ingredientSchema).min(1, "נדרש לפחות רכיב אחד או כותרת רכיבים"),
  instructions: z.array(instructionStepSchema).min(1, "נדרש לפחות שלב אחד בהוראות או כותרת הוראות"),
  imageUrl: z.string().optional(), 
  tags: z.array(z.string().min(1).max(30)).optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type IngredientFormData = z.infer<typeof ingredientSchema>;
export type InstructionStepFormData = z.infer<typeof instructionStepSchema>;
