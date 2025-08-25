
import { NextResponse } from 'next/server';
import { getCalculationFromNaturalLanguage } from '@/ai/flows/smart-calculator-flow';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const jsonRequest = await request.json();
    const { query } = z.object({ query: z.string() }).parse(jsonRequest);

    const result = await getCalculationFromNaturalLanguage(query);

    return NextResponse.json(result);
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Smart Calculator API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
