
/**
 * @fileOverview Provides smart suggestions for item descriptions.
 *
 * - getItemDescriptionSuggestion - A function that returns a smart suggestion for an item description.
 * - ItemDescriptionInput - The input type for the getItemDescriptionSuggestion function.
 * - ItemDescriptionOutput - The return type for the getItemDescriptionSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItemDescriptionInputSchema = z.object({
  itemQuery: z
    .string()
    .describe('A query or a few keywords about the item.'),
  documentContext: z
    .string()
    .describe('The context of the document (e.g., client name, subject).'),
});

export type ItemDescriptionInput = z.infer<typeof ItemDescriptionInputSchema>;

const ItemDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A suggested detailed description for the item.'),
});

export type ItemDescriptionOutput = z.infer<typeof ItemDescriptionOutputSchema>;

export async function getItemDescriptionSuggestion(
  input: ItemDescriptionInput
): Promise<ItemDescriptionOutput> {
  return itemDescriptionSuggestionFlow(input);
}

const itemDescriptionSuggestionPrompt = ai.definePrompt({
  name: 'itemDescriptionSuggestionPrompt',
  input: {schema: ItemDescriptionInputSchema},
  output: {schema: ItemDescriptionOutputSchema},
  prompt: `You are an AI assistant for a contracting company. Your task is to generate a professional and detailed item description for a quote or estimation document based on a simple query.

  Context of the document: {{documentContext}}
  User's query for the item: {{itemQuery}}

  Generate a clear, concise, and professional description suitable for a formal business document.
  `,
});

const itemDescriptionSuggestionFlow = ai.defineFlow(
  {
    name: 'itemDescriptionSuggestionFlow',
    inputSchema: ItemDescriptionInputSchema,
    outputSchema: ItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await itemDescriptionSuggestionPrompt(input);
    return output!;
  }
);
