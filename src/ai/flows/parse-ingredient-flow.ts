'use server';
/**
 * @fileOverview An AI flow for parsing a single string into a structured ingredient.
 *
 * - parseIngredient - A function that handles the ingredient parsing process.
 * - ParseIngredientInput - The input type for the parseIngredient function.
 * - ParseIngredientOutput - The return type for the parseIngredient function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ParseIngredientInputSchema = z.object({
  ingredientLine: z.string().describe('The single line of text representing an ingredient, e.g., "2 כוסות קמח"'),
});
export type ParseIngredientInput = z.infer<typeof ParseIngredientInputSchema>;

const ParseIngredientOutputSchema = z.object({
  name: z.string().describe('The name of the ingredient. If it is multi-word, it should be separated by a hyphen. e.g., "אבקת-סוכר"'),
  amount: z.number().describe('The quantity of the ingredient.'),
  unit: z.string().describe('The unit of measurement for the ingredient.'),
});
export type ParseIngredientOutput = z.infer<typeof ParseIngredientOutputSchema>;

export async function parseIngredient(input: ParseIngredientInput): Promise<ParseIngredientOutput> {
  return parseIngredientFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseIngredientPrompt',
  input: { schema: ParseIngredientInputSchema },
  output: { schema: ParseIngredientOutputSchema },
  prompt: `You are an expert at parsing recipe ingredients in Hebrew.
Parse the following ingredient line into its components: amount, unit, and name.
The pattern is: [amount] [unit] [name].

If the ingredient name has multiple words, the user will separate them with a hyphen. Your output for the name should retain the hyphen. For example, if the input contains "אבקת-סוכר", the name in the output should be "אבקת-סוכר".

Ingredient Line: {{{ingredientLine}}}
`,
});

const parseIngredientFlow = ai.defineFlow(
  {
    name: 'parseIngredientFlow',
    inputSchema: ParseIngredientInputSchema,
    outputSchema: ParseIngredientOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
