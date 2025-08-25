
import { NextResponse } from 'next/server';
import { getItemDescriptionSuggestion, ItemDescriptionInputSchema } from '@/ai/flows/item-description-suggestion-flow';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const jsonRequest = await request.json();
    const validatedRequest = ItemDescriptionInputSchema.parse(jsonRequest);

    const suggestion = await getItemDescriptionSuggestion(validatedRequest);

    return NextResponse.json(suggestion);
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Item Description Suggestion API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
