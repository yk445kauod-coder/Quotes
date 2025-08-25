
/**
 * @fileOverview An AI flow to suggest terms and payment methods for quotes and estimations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

ai.registry.registerPlugin(googleAI());


export const SmartSuggestionInputSchema = z.object({
    docType: z.string().describe("The type of the document, either 'quote' or 'estimation'."),
    subject: z.string().describe("The main subject of the document, e.g., 'توريد وتركيب كاميرات مراقبة'."),
    clientName: z.string().describe("The name of the client or company."),
});

export const SmartSuggestionOutputSchema = z.object({
    suggestedTerms: z.string().describe("The suggested terms and conditions in Arabic, formatted with newlines."),
    suggestedPaymentMethod: z.string().describe("The suggested payment method in Arabic, formatted with newlines."),
});


export async function getSmartSuggestions(input: z.infer<typeof SmartSuggestionInputSchema>): Promise<z.infer<typeof SmartSuggestionOutputSchema>> {
    return smartSuggestionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'smartSuggestionPrompt',
    input: { schema: SmartSuggestionInputSchema },
    output: { schema: SmartSuggestionOutputSchema },
    prompt: `
        You are an assistant for an Egyptian electro-mechanical contracting company. Your task is to generate appropriate "Terms and Conditions" and "Payment Methods" for a document.

        Document Details:
        - Document Type: {{docType}}
        - Client Name: {{clientName}}
        - Subject: {{subject}}

        Based on these details, provide professional and relevant suggestions for the 'Terms and Conditions' and 'Payment Method' fields. The response must be in Arabic.

        Guidelines:
        - For 'Terms', include points about price validity, delivery/work timeline, and taxes.
        - For 'Payment Method', suggest a common structure like a down payment and subsequent payments.
        - The tone should be formal and professional.
        - Tailor the suggestions slightly based on the document subject. For example, a supply-only job might have different terms than a supply-and-install job.
    `,
});


const smartSuggestionFlow = ai.defineFlow(
    {
        name: 'smartSuggestionFlow',
        inputSchema: SmartSuggestionInputSchema,
        outputSchema: SmartSuggestionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
