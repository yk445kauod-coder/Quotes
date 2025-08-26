
// This file contains client-side Firebase operations
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, push, remove, set, onValue, query, update, get, Database } from "firebase/database";
import type { DocumentData, SettingsData } from "./types";
import { firebaseConfig } from "./firebase-config";

// --- Helper Functions ---

let app: FirebaseApp;
let db: Database;

const FIXED_PAY_METHOD = "نقدا او بأمر دفع على حساب 3913070223277800019 البنك الاهلي فرع كفر الدوار\nاو حساب رقم 5590001000000924 بنك مصر فرع المنتزه";


function initializeDb() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getDatabase(app);
  }
}

/**
 * Subscribes to document changes from Realtime Database.
 * @param callback Function to call with the documents array whenever data changes.
 * @returns An unsubscribe function to stop listening for updates.
 */
export function subscribeToDocuments(callback: (documents: DocumentData[]) => void): () => void {
  initializeDb();
  const documentsRef = ref(db, "documents");
  // Removed orderByChild to prevent indexing error. Sorting is now done on the client.
  const documentsQuery = query(documentsRef);

  const unsubscribe = onValue(documentsQuery, (snapshot) => {
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
    console.error("Error subscribing to documents:", error);
    callback([]);
  });

  return unsubscribe;
}


/**
 * Saves a new document to the Realtime Database.
 * @param document The document data to save.
 */
export async function saveDocument(document: Omit<DocumentData, 'id' | 'docId'>): Promise<string> {
  initializeDb();
  const documentsRef = ref(db, "documents");
  const newDocRef = push(documentsRef);
  
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
  await set(counterRef, { count: newCount });
  return newDocRef.key!;
}

/**
 * Updates an existing document in the Realtime Database.
 * @param id The unique key of the document to update.
 * @param document The document data to update.
 */
export async function updateDocument(id: string, document: DocumentData): Promise<void> {
    initializeDb();
    const documentRef = ref(db, `documents/${id}`);
    const { id: docId, ...dataToUpdate } = document;
    await update(documentRef, dataToUpdate);
}


/**
 * Deletes a document from the Realtime Database.
 * @param id The unique key of the document to delete.
 */
export async function deleteDocument(id: string): Promise<void> {
  initializeDb();
  if (!id) {
    throw new Error("Document ID is required.");
  }
  const documentRef = ref(db, `documents/${id}`);
  await remove(documentRef);
}


// --- Settings Functions ---

/**
 * Saves the application settings to the Realtime Database.
 * @param settings The settings data to save.
 */
export async function saveSettings(settings: SettingsData): Promise<void> {
    initializeDb();
    const settingsRef = ref(db, 'settings');
    await set(settingsRef, settings);
}

/**
 * Gets the application settings from the Realtime Database for client-side usage.
 * @returns A promise resolving to the settings data or default values.
 */
export async function getSettings(): Promise<SettingsData> {
    initializeDb();
    const settingsRef = ref(db, 'settings');
    try {
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            const settings = snapshot.val();
            // Ensure new fields have default values if they are missing
            return {
                headerImageUrl: "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527",
                footerText: "Company Name\nAddress\nPhone & Email",
                defaultTerms: "الأسعار شاملة الضريبة\nصالحة لمدة 30 يوم\nالتسليم خلال 15 يوم عمل",
                pinTermsAndPayment: false,
                itemsPerPage: 13,
                ...settings
            };
        }
    } catch (error) {
        console.error("Client Error fetching settings:", error);
    }
    // Return default values if no settings are found or on error
    return {
        headerImageUrl: "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527",
        footerText: "Company Name\nAddress\nPhone & Email",
        defaultTerms: "الأسعار شاملة الضريبة\nصالحة لمدة 30 يوم\nالتسليم خلال 15 يوم عمل",
        pinTermsAndPayment: false,
        itemsPerPage: 13,
    };
}
