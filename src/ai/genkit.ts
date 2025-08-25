
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
    plugins: [
        googleAI({
            // Specify the API version.
            apiVersion: 'v1beta',
        }),
    ],
    // Log failures only.
    logLevel: 'warn',
    // Enable OpenTelemetry-based tracing.
    enableTracing: true,
});
