
/**
 * @fileOverview An AI flow to suggest a detailed item description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

ai.registry.registerPlugin(googleAI());

export const ItemDescriptionInputSchema = z.object({
    docType: z.string().describe("The type of the document, either 'quote' or 'estimation'."),
    subject: z.string().describe("The main subject of the document, e.g., 'تأسيس كهرباء شقة'."),
    currentItemDescription: z.string().describe("The current (potentially simple) description of the item, e.g., 'سلك 2مم'."),
});

export const ItemDescriptionOutputSchema = z.string().describe("A detailed, professional description for the item in Arabic.");

export async function getItemDescriptionSuggestion(input: z.infer<typeof ItemDescriptionInputSchema>): Promise<z.infer<typeof ItemDescriptionOutputSchema>> {
    return itemDescriptionSuggestionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'itemDescriptionSuggestionPrompt',
    input: { schema: ItemDescriptionInputSchema },
    output: { schema: ItemDescriptionOutputSchema },
    prompt: `
        You are an expert electrical contractor in Egypt. Your task is to expand a simple item description into a professional, detailed one suitable for a formal quote or estimation document.

        Document Details:
        - Document Type: {{docType}}
        - Subject: {{subject}}

        Current Item Description:
        - "{{currentItemDescription}}"

        Based on the context, rewrite the current item description into a full, professional Arabic sentence. Include necessary technical details if they can be inferred (like brand names if common, specifications, etc.). The final output should be ONLY the new description text.

        Example:
        - Input: "مفتاح 3 فاز"
        - Output: "توريد وتركيب مفتاح أوتوماتيك 3 فاز 63 أمبير نوع شنايدر."

        Example:
        - Input: "تكييف"
        - Output: "توريد وتركيب جهاز تكييف سبليت 1.5 حصان بارد/ساخن شامل الوحدة الداخلية والخارجية."
    `,
});

const itemDescriptionSuggestionFlow = ai.defineFlow(
    {
        name: 'itemDescriptionSuggestionFlow',
        inputSchema: ItemDescriptionInputSchema,
        outputSchema: ItemDescriptionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
