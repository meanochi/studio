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
  name: z.string().describe("The name of the ingredient, e.g., 'Flour', 'Sugar', 'Milk', 'קמח', 'סוכר'. Extracted from the 'ingredient' part of 'amount unit ingredient' format."),
  amount: z.number().describe("The numerical amount of the ingredient, e.g., 2, 0.5, 100. Extracted from the 'amount' part."),
  unit: z.string().describe("The unit of measurement for the ingredient, e.g., 'cups', 'grams', 'ml', 'tsp', 'tbsp', 'כוסות', 'גרם'. Extracted from shameful 'unit' part.")
});

// Define Zod schema for the output, matching RecipeFormData
// This schema guides the LLM on the desired output structure.
export const ParseRecipeFromTextOutputSchema = z.object({
  name: z.string().min(1).describe("The name or title of the recipe. Typically found on the first line of the PDF, often in a larger font."),
  source: z.string().optional().describe("The source of the recipe (e.g., cookbook name, website, person's name). Typically found on the second line of the PDF. If not present, omit this field."),
  prepTime: z.string().optional().describe("Preparation time, e.g., '20 minutes', '1 hour'. If not explicitly found in the text, omit this field."),
  cookTime: z.string().optional().describe("Cooking time, e.g., '30 minutes', '45-50 minutes'. If not explicitly found, omit this field."),
  servings: z.number().int().min(1).optional().describe("Number of servings the recipe makes. If not specified, default to 1."),
  servingUnit: z.string().optional().describe("The unit for servings, e.g., 'people', 'cookies', 'servings', 'מנות'. If not specified, default to 'מנות' or a relevant unit based on the recipe name."),
  freezable: z.boolean().optional().default(false).describe("Whether the recipe can be frozen. Infer if possible from keywords like 'freeze', 'can be frozen'. If no indication, default to false."),
  ingredients: z.array(IngredientOutputSchema).min(1).describe("An array of ingredients. Ingredients are typically listed under a specific title (e.g., 'Ingredients', 'רכיבים'). Each ingredient follows an 'amount unit ingredient' format (e.g., '1 כוס סוכר', '200 גרם קמח')."),
  instructions: z.array(z.string().min(1)).min(1).describe("An array of strings, where each string is a step in the recipe instructions. Instructions are typically listed under a specific title (e.g., 'Instructions', 'הוראות הכנה') and each step is often on a new line."),
  imageUrl: z.string().url().optional().describe("A URL to an image of the recipe. Usually not present in text-only PDFs based on the described format; omit if not found."),
  tags: z.array(z.string().min(1)).optional().describe("A list of relevant tags or categories. If not explicitly mentioned or inferable, omit this field."),
});
export type ParseRecipeFromTextOutput = z.infer<typeof ParseRecipeFromTextOutputSchema>;

export const ParseRecipeFromTextInputSchema = z.object({
  recipeText: z.string().min(10).describe('The full raw text extracted from a recipe document (e.g., PDF).'),
});
export type ParseRecipeFromTextInput = z.infer<typeof ParseRecipeFromTextInputSchema>;


export async function parseRecipeFromText(input: ParseRecipeFromTextInput): Promise<ParseRecipeFromTextOutput> {
  // Ensure the output strictly conforms to the schema.
  return parseRecipeFlow(input);
}

const systemPrompt = `You are an expert recipe parsing AI. Your task is to meticulously analyze the provided recipe text, which comes from a PDF with a specific, consistent format, and extract its components into a structured JSON object.

The PDF format is typically as follows:
1.  **Recipe Name**: The first line, often in a larger font.
2.  **Source**: The second line. This field is optional; if it's not clearly a source, omit it.
3.  **Ingredients Section**: Starts with a title (like 'Ingredients' or 'רכיבים'). Below this title, ingredients are listed.
    *   Each ingredient is in the format: \`amount unit ingredient_name\` (e.g., "1 כוס סוכר", "200 גרם קמח"). Ensure you extract these three parts for each ingredient. Amounts should be numerical; convert fractions (e.g., 1/2, 2 1/4) to decimals (e.g., 0.5, 2.25).
4.  **Instructions Section**: Starts with a title (like 'Instructions' or 'הוראות הכנה'). Below this title, instructions are listed, with each step usually on a new line. Each line break should be treated as a new instruction step.

Your goal is to extract these elements into the specified JSON output schema.

**Detailed field instructions:**
-   **name**: Extract from the first line.
-   **source**: Extract from the second line if it appears to be a source; otherwise, omit.
-   **ingredients**: Must be an array of objects, each with \`name\`, \`amount\`, and \`unit\`. Parse the "amount unit ingredient_name" structure carefully.
-   **instructions**: Must be an array of strings, with each string representing a distinct step, typically corresponding to a line in the instructions section of the PDF.

**The following fields are likely NOT present in this specific PDF format, so you should generally OMIT them or use defaults if the schema requires and no information is found:**
-   **prepTime**: Omit if not explicitly found.
-   **cookTime**: Omit if not explicitly found.
-   **servings**: If not found, default to 1.
-   **servingUnit**: If servings is 1 and no unit is found, default to 'מנה' or infer from recipe name if possible. Otherwise, omit.
-   **freezable**: Default to \`false\` if not mentioned.
-   **imageUrl**: Omit if not found.
-   **tags**: Omit if not explicitly listed or easily inferable from the primary content.

**Language Considerations:**
- The input recipe text might be in Hebrew or English.
- Output fields like \`name\`, \`source\`, ingredient \`name\`s, ingredient \`unit\`s, \`instructions\`, and \`tags\` (if any) should generally match the language of the input text.
- Numerical values (\`amount\`, \`servings\`) must be numbers.

Format your entire output as a single JSON object adhering to the provided schema.
Pay very close attention to the data types and constraints specified in the output schema.
If the text does not seem to follow the expected recipe structure, or if essential parts like ingredients or instructions are missing after a section title, still try to parse what's available but be mindful of the schema requirements.
`;

const recipeParserPrompt = ai.definePrompt({
  name: 'recipeParserPrompt',
  system: systemPrompt,
  input: { schema: ParseRecipeFromTextInputSchema },
  output: { schema: ParseRecipeFromTextOutputSchema }, // Ensure LLM output adheres to this schema
  prompt: `Please parse the following recipe text extracted from a PDF, adhering to the described format:

  {{{recipeText}}}

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
        let missingFields = [];
        if (!output.name) missingFields.push("name");
        if (!output.ingredients || output.ingredients.length === 0) missingFields.push("ingredients");
        if (!output.instructions || output.instructions.length === 0) missingFields.push("instructions");
        throw new Error(`Parsed recipe is missing essential fields: ${missingFields.join(', ')}. The AI might have struggled with this format or the PDF text was incomplete.`);
    }
    return output;
  }
);
