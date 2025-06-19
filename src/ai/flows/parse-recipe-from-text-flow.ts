'use server';
/**
 * @fileOverview A Genkit flow to parse recipe details from raw text.
 *
 * - parseRecipeFromText - A function that takes raw text and returns structured recipe data.
 * - ParseRecipeFromTextInput - The input type for the parseRecipeFromText function.
 * - ParseRecipeFromTextOutput - The return type for the parseRecipeFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RecipeFormData, IngredientFormData } from '@/components/recipes/RecipeSchema'; // Using types for output structure

// Define Zod schema for the ingredient, matching IngredientFormData but making id optional
const IngredientOutputSchema = z.object({
  name: z.string().describe("The name of the ingredient, e.g., 'Flour', 'Sugar', 'Milk'."),
  amount: z.number().describe("The numerical amount of the ingredient, e.g., 2, 0.5, 100."),
  unit: z.string().describe("The unit of measurement for the ingredient, e.g., 'cups', 'grams', 'ml', 'tsp', 'tbsp'.")
});

// Define Zod schema for the output, matching RecipeFormData
// This schema guides the LLM on the desired output structure.
export const ParseRecipeFromTextOutputSchema = z.object({
  name: z.string().min(1).describe("The name or title of the recipe."),
  source: z.string().optional().describe("The source of the recipe (e.g., cookbook name, website, person's name). If not found, omit this field."),
  prepTime: z.string().optional().describe("Preparation time, e.g., '20 minutes', '1 hour'. Try to identify this if present."),
  cookTime: z.string().optional().describe("Cooking time, e.g., '30 minutes', '45-50 minutes'. Try to identify this if present."),
  servings: z.number().int().min(1).optional().describe("Number of servings the recipe makes. Default to 1 if not specified."),
  servingUnit: z.string().optional().describe("The unit for servings, e.g., 'people', 'cookies', 'servings'. Default to 'מנות' if not specified."),
  freezable: z.boolean().optional().default(false).describe("Whether the recipe can be frozen. Infer if possible (e.g. mentions freezing instructions), default to false."),
  ingredients: z.array(IngredientOutputSchema).min(1).describe("An array of ingredients, each with a name, amount, and unit."),
  instructions: z.array(z.string().min(1)).min(1).describe("An array of strings, where each string is a step in the recipe instructions."),
  imageUrl: z.string().optional().describe("A URL to an image of the recipe. Usually not present in text-only recipes; omit if not found."),
  tags: z.array(z.string().min(1)).optional().describe("A list of relevant tags or categories for the recipe (e.g., 'dessert', 'vegetarian', 'quick'). Infer these from the recipe content if possible."),
});
export type ParseRecipeFromTextOutput = z.infer<typeof ParseRecipeFromTextOutputSchema>;

export const ParseRecipeFromTextInputSchema = z.object({
  recipeText: z.string().min(10).describe('The full raw text extracted from a recipe document (e.g., PDF).'),
});
export type ParseRecipeFromTextInput = z.infer<typeof ParseRecipeFromTextInputSchema>;


export async function parseRecipeFromText(input: ParseRecipeFromTextInput): Promise<ParseRecipeFromTextOutput> {
  // Ensure the output strictly conforms to the schema.
  // This might involve post-processing or more specific prompting if the LLM struggles.
  return parseRecipeFlow(input);
}

const systemPrompt = `You are an expert recipe parsing AI. Your task is to meticulously analyze the provided recipe text and extract its components into a structured JSON format.
The recipe components to extract are: name, source (optional), prepTime (optional), cookTime (optional), servings (optional, default to 1), servingUnit (optional, default to 'מנות'), freezable (optional, default to false), ingredients (array of objects with name, amount, unit), instructions (array of strings), imageUrl (optional), and tags (optional, array of strings).

- Ingredients: For each ingredient, accurately identify its name, numerical amount, and unit of measurement. If an ingredient has no explicit amount or unit (e.g., "salt to taste"), try to represent it meaningfully or use common defaults if appropriate (e.g., amount: 1, unit: 'pinch').
- Instructions: Separate each distinct step of the cooking instructions into its own string in the array.
- Servings: If not explicitly mentioned, default servings to 1 and servingUnit to 'מנות'.
- Freezable: Infer if the recipe is freezable if keywords like "freeze", "can be frozen" appear, otherwise default to false.
- Tags: Infer a few relevant tags based on the recipe content (e.g., 'main course', 'dessert', 'vegan', 'quick meal').
- Language: The input recipe text might be in Hebrew or English. Output fields like name, source, ingredient names, units, instructions, and tags should generally match the language of the input text or be in Hebrew if the context implies it (e.g., for a Hebrew cookbook app). Numerical values (amount, servings) should remain numbers.

Format your entire output as a single JSON object adhering to the provided schema.
Pay close attention to the data types and constraints specified in the output schema.
If a field is optional and the information is not found in the text, omit the field or use the specified default.
Ensure all ingredient amounts are numbers. Convert fractions (e.g., 1/2, 2 1/4) to decimal numbers (e.g., 0.5, 2.25).
`;

const recipeParserPrompt = ai.definePrompt({
  name: 'recipeParserPrompt',
  system: systemPrompt,
  input: { schema: ParseRecipeFromTextInputSchema },
  output: { schema: ParseRecipeFromTextOutputSchema }, // Ensure LLM output adheres to this schema
  prompt: `Please parse the following recipe text:

  {{recipeText}}

  Provide the output as a JSON object matching the schema.
  `,
});

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeFromTextInputSchema,
    outputSchema: ParseRecipeFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await recipeParserPrompt(input);
    if (!output) {
        throw new Error("AI model did not return an output, or the output was empty.");
    }
    // Basic validation, more complex validation might be needed
    if (!output.name || !output.ingredients || output.ingredients.length === 0 || !output.instructions || output.instructions.length === 0) {
        throw new Error("Parsed recipe is missing essential fields (name, ingredients, or instructions). The AI might have struggled with this format.");
    }
    return output;
  }
);

// Helper function to add this flow to Genkit dev UI
// This should be imported in src/ai/dev.ts
export function selfRegister() {
    // no-op, flow is defined above and will be picked up by genkit
}
