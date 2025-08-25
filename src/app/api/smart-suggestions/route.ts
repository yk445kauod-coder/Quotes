
import { NextResponse } from 'next/server';
import { getSmartSuggestions, SmartSuggestionInputSchema } from '@/ai/flows/smart-suggestion-tool';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const jsonRequest = await request.json();
    const validatedRequest = SmartSuggestionInputSchema.parse(jsonRequest);

    const suggestions = await getSmartSuggestions(validatedRequest);

    return NextResponse.json(suggestions);
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Smart Suggestion API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
