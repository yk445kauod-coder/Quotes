
/**
 * @fileOverview An AI flow to parse natural language and extract a mathematical expression.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const CalculatorInputSchema = z.string().describe("A natural language query describing a calculation.");

export const CalculatorOutputSchema = z.object({
  expression: z.string().describe("The mathematical expression derived from the query, e.g., '5 * 50'."),
  result: z.number().describe("The numerical result of the expression."),
});

export async function getCalculationFromNaturalLanguage(input: z.infer<typeof CalculatorInputSchema>): Promise<z.infer<typeof CalculatorOutputSchema>> {
    return smartCalculatorFlow(input);
}

const prompt = ai.definePrompt({
    name: 'smartCalculatorPrompt',
    input: { schema: CalculatorInputSchema },
    output: { schema: CalculatorOutputSchema },
    prompt: `
        You are a smart calculator assistant. Your task is to interpret a natural language query in Arabic and convert it into a standard mathematical expression and calculate its result.

        Query:
        "{{input}}"

        Rules:
        - Extract only the numbers and the operation.
        - Supported operations are addition (+), subtraction (-), multiplication (*), and division (/).
        - The output must be a JSON object with 'expression' and 'result'.
        - If the query does not contain a clear mathematical operation, return an expression of "0" and a result of 0.

        Example 1:
        - Query: "حساب تكلفة 5 لمبات سعر الواحدة 50 جنيه"
        - Output: { "expression": "5 * 50", "result": 250 }

        Example 2:
        - Query: "اجمع 100 و 250"
        - Output: { "expression": "100 + 250", "result": 350 }
        
        Example 3:
        - Query: "خصم 75 من 300"
        - Output: { "expression": "300 - 75", "result": 225 }
        
        Example 4:
        - Query: "هذا مجرد نص عادي"
        - Output: { "expression": "0", "result": 0 }
    `,
});

const smartCalculatorFlow = ai.defineFlow(
    {
        name: 'smartCalculatorFlow',
        inputSchema: CalculatorInputSchema,
        outputSchema: CalculatorOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
