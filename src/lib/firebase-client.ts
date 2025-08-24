// This file contains client-side Firebase operations
import { db } from "./firebase";
import { ref, get, push, remove, set, onValue, query, orderByChild, update } from "firebase/database";
import type { DocumentData } from "./types";

/**
 * Gets documents from Realtime Database and listens for changes.
 * @param callback Function to call with the documents array whenever data changes.
 * @returns An unsubscribe function to stop listening for updates.
 */
export function getDocuments(callback: (documents: DocumentData[]) => void): () => void {
  const documentsRef = ref(db, "documents");
  // Query to get the latest 50 documents, ordered by creation time
  const recentDocumentsQuery = query(documentsRef, orderByChild('createdAt'));

  const unsubscribe = onValue(recentDocumentsQuery, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const documentList: DocumentData[] = Object.keys(data)
        .map(key => ({ ...data[key], id: key } as DocumentData))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort descending
      callback(documentList);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Error fetching documents:", error);
    callback([]); // Send empty array on error
  });

  return unsubscribe;
}

/**
 * Gets a single document by its ID from the Realtime Database.
 * @param id The unique key of the document to fetch.
 * @returns The document data or null if not found.
 */
export async function getDocumentById(id: string): Promise<DocumentData | null> {
    const documentRef = ref(db, `documents/${id}`);
    const snapshot = await get(documentRef);
    if (snapshot.exists()) {
        return { ...snapshot.val(), id: snapshot.key } as DocumentData;
    }
    return null;
}


/**
 * Saves a new document to the Realtime Database.
 * @param document The document data to save.
 */
export async function saveDocument(document: Omit<DocumentData, 'id' | 'docId'>): Promise<void> {
  const documentsRef = ref(db, "documents");
  const newDocRef = push(documentsRef);
  
  // Get the next docId - for simplicity, we'll do this on the client.
  // In a production app, this should be a transaction on the server to prevent race conditions.
  const counterRef = ref(db, `counters/${document.docType}`);
  const snapshot = await get(counterRef);
  const newCount = (snapshot.val()?.count || 0) + 1;
  const prefix = document.docType === 'quote' ? 'Q' : 'E';
  const docId = `${prefix}-${new Date().getFullYear()}-${String(newCount).padStart(3, '0')}`;
  
  const docWithRealId: Omit<DocumentData, 'id'> = {
    ...document,
    docId,
  };

  await set(newDocRef, docWithRealId);
  // Also update the counter
  await set(counterRef, { count: newCount });
}

/**
 * Updates an existing document in the Realtime Database.
 * @param id The unique key of the document to update.
 * @param document The document data to update.
 */
export async function updateDocument(id: string, document: DocumentData): Promise<void> {
    const documentRef = ref(db, `documents/${id}`);
    // Omit the 'id' field before updating, as it's the key and not part of the data object.
    const { id: docId, ...dataToUpdate } = document;
    await update(documentRef, dataToUpdate);
}


/**
 * Deletes a document from the Realtime Database.
 * @param id The unique key of the document to delete.
 */
export async function deleteDocument(id: string): Promise<void> {
  if (!id) {
    throw new Error("Document ID is required.");
  }
  const documentRef = ref(db, `documents/${id}`);
  await remove(documentRef);
}
