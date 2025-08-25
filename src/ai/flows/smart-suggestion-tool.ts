
/**
 * @fileOverview Provides smart suggestions for terms and conditions and payment methods for quotes and estimations.
 *
 * - getSmartSuggestions - A function that returns smart suggestions based on the document type and details.
 * - SmartSuggestionInput - The input type for the getSmartSuggestions function.
 * - SmartSuggestionOutput - The return type for the getSmartSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSuggestionInputSchema = z.object({
  documentType: z
    .enum(['quote', 'estimation'])
    .describe('The type of document being created (quote or estimation).'),
  documentDetails: z
    .string()
    .describe('Details about the document content, used for context.'),
});

export type SmartSuggestionInput = z.infer<typeof SmartSuggestionInputSchema>;

const SmartSuggestionOutputSchema = z.object({
  termsAndConditions: z
    .string()
    .describe('Suggested terms and conditions for the document.'),
  paymentMethods: z
    .string()
    .describe('Suggested payment methods for the document.'),
});

export type SmartSuggestionOutput = z.infer<typeof SmartSuggestionOutputSchema>;

export async function getSmartSuggestions(
  input: SmartSuggestionInput
): Promise<SmartSuggestionOutput> {
  return smartSuggestionFlow(input);
}

const smartSuggestionPrompt = ai.definePrompt({
  name: 'smartSuggestionPrompt',
  input: {schema: SmartSuggestionInputSchema},
  output: {schema: SmartSuggestionOutputSchema},
  prompt: `You are an AI assistant specialized in generating appropriate terms and conditions, and payment methods, for business documents.

  Based on the document type and details provided, suggest relevant terms and conditions, and payment methods.

  Document Type: {{documentType}}
  Document Details: {{documentDetails}}

  Terms and Conditions:  (Provide a concise and professional suggestion for terms and conditions.)
  Payment Methods: (Provide a suggestion for payment methods that are suitable for the document type.)`,
});

const smartSuggestionFlow = ai.defineFlow(
  {
    name: 'smartSuggestionFlow',
    inputSchema: SmartSuggestionInputSchema,
    outputSchema: SmartSuggestionOutputSchema,
  },
  async input => {
    const {output} = await smartSuggestionPrompt(input);
    return output!;
  }
);
