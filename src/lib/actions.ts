"use server";

import { revalidatePath } from "next/cache";
import { getSmartSuggestions } from "@/ai/flows/smart-suggestion-tool";
import type { SmartSuggestionInput } from "@/ai/flows/smart-suggestion-tool";
import { getItemDescriptionSuggestion } from "@/ai/flows/item-description-suggestion-flow";
import type { ItemDescriptionInput } from "@/ai/flows/item-description-suggestion-flow";
import type { DocumentData } from "./types";
import { db, adminDb } from "./firebase";
import { ref, get, push, remove, set } from "firebase/database";
import { runTransaction } from "firebase/database";

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

export async function getDocuments(): Promise<DocumentData[]> {
  try {
    const documentsRef = ref(db, "documents");
    const snapshot = await get(documentsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const documentList = Object.keys(data)
        .map(key => ({ ...data[key], id: key } as DocumentData))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return documentList;
    }
    return [];
  } catch (error) {
     console.error("Error fetching documents:", error);
     return [];
  }
}

async function getNextDocId(docType: 'quote' | 'estimation'): Promise<string> {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized. Please set FIREBASE_SERVICE_ACCOUNT_KEY in .env");
    }
    const counterRef = adminDb.ref(`counters/${docType}`);
    
    const result = await counterRef.transaction((currentData) => {
        if (currentData === null) {
            return { count: 1 };
        }
        return { count: (currentData.count || 0) + 1 };
    });

    if (!result.committed) {
        throw new Error('Failed to update document counter.');
    }
    
    const newCount = result.snapshot.val().count;
    const prefix = docType === 'quote' ? 'Q' : 'E';
    return `${prefix}-${new Date().getFullYear()}-${String(newCount).padStart(3, '0')}`;
}


export async function saveDocument(document: Omit<DocumentData, 'id' | 'createdAt' | 'docId'>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
        return { success: false, error: "Firebase Admin SDK not configured on the server. Please check your FIREBASE_SERVICE_ACCOUNT_KEY." };
    }
    const docId = await getNextDocId(document.docType);
    
    const newDocument = {
      ...document,
      docId: docId,
      createdAt: new Date().toISOString(),
    };

    const documentsRef = ref(db, "documents");
    const newDocRef = push(documentsRef);
    await set(newDocRef, newDocument);
    
    revalidatePath("/");
    revalidatePath("/create");
    return { success: true };
  } catch (error) {
    console.error("Error saving document:", error);
    const errorMessage = error instanceof Error ? error.message : "فشل في حفظ المستند.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
        throw new Error("Document ID is required.");
    }
    const documentRef = ref(db, `documents/${id}`);
    await remove(documentRef);
    revalidatePath("/");
    return { success: true };
  } catch (error)
  {
    console.error("Error deleting document:", error);
    const errorMessage = error instanceof Error ? error.message : "فشل في حذف المستند.";
    return { success: false, error: errorMessage };
  }
}
