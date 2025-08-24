'use server';

import { getSmartSuggestions } from "@/ai/flows/smart-suggestion-tool";
import type { SmartSuggestionInput } from "@/ai/flows/smart-suggestion-tool";
import { getItemDescriptionSuggestion } from "@/ai/flows/item-description-suggestion-flow";
import type { ItemDescriptionInput } from "@/ai/flows/item-description-suggestion-flow";

// AI actions remain on the server
export async function fetchSmartSuggestionsAction(input: SmartSuggestionInput) {
  try {
    const suggestions = await getSmartSuggestions(input);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("Error fetching smart suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "فشل في جلب الاقتراحات.";
    return { success: false, error: errorMessage };
  }
}

export async function fetchItemDescriptionSuggestionAction(input: ItemDescriptionInput) {
    try {
        const suggestion = await getItemDescriptionSuggestion(input);
        return { success: true, data: suggestion };
    } catch (error) {
        console.error("Error fetching item description suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : "فشل في اقتراح الوصف.";
        return { success: false, error: errorMessage };
    }
}
