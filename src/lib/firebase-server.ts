
// This file contains SERVER-SIDE Firebase operations
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, get, query, Database } from "firebase/database";
import type { DocumentData, SettingsData } from "./types";
import { firebaseConfig } from "./firebase-config";
import "server-only";

// --- Helper Functions for Server ---

let app: FirebaseApp;
let db: Database;

function initializeDbServer() {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getDatabase(app);
}

/**
 * Gets documents from Realtime Database once for server-side rendering.
 * @returns A promise that resolves with the documents array.
 */
export async function getDocuments(): Promise<DocumentData[]> {
  initializeDbServer();
  const documentsRef = ref(db, "documents");
  // Removed orderByChild to prevent indexing error. Sorting is now done in the application code.
  const documentsQuery = query(documentsRef);

  try {
    const snapshot = await get(documentsQuery);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const documentList: DocumentData[] = Object.keys(data)
        .map(key => ({ ...data[key], id: key } as DocumentData))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort descending
      return documentList;
    }
    return [];
  } catch (error) {
    console.error("Server Error fetching documents:", error);
    return [];
  }
}

/**
 * Gets a single document by its ID from the Realtime Database for server-side rendering.
 * @param id The unique key of the document to fetch.
 * @returns A promise resolving to the document data or null if not found.
 */
export async function getDocumentById(id: string): Promise<DocumentData | null> {
    initializeDbServer();
    const documentRef = ref(db, `documents/${id}`);
    try {
        const snapshot = await get(documentRef);
        if (snapshot.exists()) {
            return { ...snapshot.val(), id: snapshot.key } as DocumentData;
        }
        return null;
    } catch (error) {
        console.error(`Server Error fetching document ${id}:`, error);
        return null;
    }
}


// --- Settings Functions for Server ---

/**
 * Gets the application settings from the Realtime Database for server-side rendering.
 * @returns A promise resolving to the settings data or default values.
 */
export async function getSettings(): Promise<SettingsData> {
    initializeDbServer();
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
                defaultPaymentMethod: "نقدا او بأمر دفع على حساب 3913070223277800019 البنك الاهلي فرع كفر الدوار\nاو حساب رقم 5590001000000924 بنك مصر فرع المنتزه",
                pinTermsAndPayment: false,
                itemsPerPage: 13,
                ...settings,
            };
        }
    } catch (error) {
        console.error("Server Error fetching settings:", error);
    }
    // Return default values if no settings are found or on error
    return {
        headerImageUrl: "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527",
        footerText: "Company Name\nAddress\nPhone & Email",
        defaultTerms: "الأسعار شاملة الضريبة\nصالحة لمدة 30 يوم\nالتسليم خلال 15 يوم عمل",
        defaultPaymentMethod: "نقدا او بأمر دفع على حساب 3913070223277800019 البنك الاهلي فرع كفر الدوار\nاو حساب رقم 5590001000000924 بنك مصر فرع المنتزه",
        pinTermsAndPayment: false,
        itemsPerPage: 13,
    };
}
