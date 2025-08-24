"use server";

import { revalidatePath } from "next/cache";
import { getSmartSuggestions } from "@/ai/flows/smart-suggestion-tool";
import type { SmartSuggestionInput } from "@/ai/flows/smart-suggestion-tool";
import type { DocumentData } from "./types";

// MOCK DATABASE
const MOCK_DOCUMENTS: DocumentData[] = [];
let lastId = 0;

export async function fetchSmartSuggestionsAction(input: SmartSuggestionInput) {
  try {
    const suggestions = await getSmartSuggestions(input);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("Error fetching smart suggestions:", error);
    return { success: false, error: "فشل في جلب الاقتراحات." };
  }
}

export async function getDocuments(): Promise<DocumentData[]> {
  // In a real app, this would fetch from Firestore
  return Promise.resolve(MOCK_DOCUMENTS);
}

export async function saveDocument(document: Omit<DocumentData, 'id' | 'createdAt' | 'docId'>): Promise<{ success: boolean; error?: string }> {
  try {
    lastId++;
    const prefix = document.docType === 'quote' ? 'Q' : 'E';
    const newDocument: DocumentData = {
      ...document,
      id: Date.now().toString(),
      docId: `${prefix}-${new Date().getFullYear()}-${String(lastId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_DOCUMENTS.unshift(newDocument);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error saving document:", error);
    return { success: false, error: "فشل في حفظ المستند." };
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const index = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
    if (index > -1) {
      MOCK_DOCUMENTS.splice(index, 1);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error)
  {
    console.error("Error deleting document:", error);
    return { success: false, error: "فشل في حذف المستند." };
  }
}
