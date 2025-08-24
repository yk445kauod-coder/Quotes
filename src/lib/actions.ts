"use server";

import { revalidatePath } from "next/cache";
import { getSmartSuggestions } from "@/ai/flows/smart-suggestion-tool";
import type { SmartSuggestionInput } from "@/ai/flows/smart-suggestion-tool";
import { getItemDescriptionSuggestion } from "@/ai/flows/item-description-suggestion-flow";
import type { ItemDescriptionInput } from "@/ai/flows/item-description-suggestion-flow";
import type { DocumentData } from "./types";
import { db } from "./firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc } from "firebase/firestore";

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
    const documentsCol = collection(db, "documents");
    const q = query(documentsCol, orderBy("createdAt", "desc"));
    const documentSnapshot = await getDocs(q);
    const documentList = documentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DocumentData));
    return documentList;
  } catch (error) {
     console.error("Error fetching documents:", error);
     return [];
  }
}

async function getNextDocId(docType: 'quote' | 'estimation'): Promise<string> {
    const counterRef = doc(db, 'counters', docType);
    const counterSnap = await getDoc(counterRef);
    let newCount = 1;
    if (counterSnap.exists()) {
        newCount = counterSnap.data().count + 1;
    }
    
    // This should be in a transaction in a real app
    // await runTransaction(db, async (transaction) => { ... });
    // For now, we'll just update it.
    const { setDoc } = await import("firebase/firestore");
    await setDoc(counterRef, { count: newCount });

    const prefix = docType === 'quote' ? 'Q' : 'E';
    return `${prefix}-${new Date().getFullYear()}-${String(newCount).padStart(3, '0')}`;
}


export async function saveDocument(document: Omit<DocumentData, 'id' | 'createdAt' | 'docId'>): Promise<{ success: boolean; error?: string }> {
  try {
    const docId = await getNextDocId(document.docType);
    
    const newDocument = {
      ...document,
      docId: docId,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "documents"), newDocument);
    
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
    await deleteDoc(doc(db, "documents", id));
    revalidatePath("/");
    return { success: true };
  } catch (error)
  {
    console.error("Error deleting document:", error);
    const errorMessage = error instanceof Error ? error.message : "فشل في حذف المستند.";
    return { success: false, error: errorMessage };
  }
}
