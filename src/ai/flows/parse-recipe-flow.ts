
'use server';
/**
 * @fileOverview An AI flow for parsing a full recipe text into a structured Recipe object.
 *
 * - parseRecipe - A function that handles the recipe parsing process.
 * - ParseRecipeInput - The input type for the parseRecipe function.
 * - ParseRecipeOutput - The return type for the parseRecipe function (matches RecipeFormData).
 */

import { ai } from '@/ai/genkit';
import { recipeSchema, RecipeFormData } from '@/components/recipes/RecipeSchema';
import { z } from 'zod';

const ParseRecipeInputSchema = z.object({
  recipeText: z.string().describe('The full text of the recipe to be parsed.'),
});
export type ParseRecipeInput = z.infer<typeof ParseRecipeInputSchema>;

// The output is the same as the form data schema
export type ParseRecipeOutput = RecipeFormData;

export async function parseRecipe(input: ParseRecipeInput): Promise<ParseRecipeOutput> {
  return parseRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseRecipePrompt',
  input: { schema: ParseRecipeInputSchema },
  output: { schema: recipeSchema },
  prompt: `You are an expert culinary assistant. Your task is to parse the following recipe text into a structured JSON object.
Follow the output schema precisely.

- Extract the recipe name, source (if available), prep time, cook time, servings, and serving unit.
- If prepTime is not mentioned, set it to "לא צוין".
- If servingUnit is not mentioned, set it to "מנות".
- Determine if the recipe is freezable based on the text.
- Identify all ingredients. If an ingredient is marked as optional, set the 'isOptional' flag. If there are headings within the ingredients list (e.g., "For the dough:"), create an ingredient item with the 'isHeading' flag set to true.
- Identify all instruction steps. If there are headings within the instructions (e.g., "Making the filling:"), create an instruction item with the 'isHeading' flag set to true.
- Identify any tags or categories mentioned in the text.
- Do not invent any information. If a field cannot be determined from the text, leave it as an empty string, false, or an empty array as appropriate according to the schema, except for the required fields mentioned above.
- For ingredient names with multiple words, use spaces, not hyphens. e.g., "אבקת סוכר".

Recipe Text:
{{{recipeText}}}
`,
});

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: recipeSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
