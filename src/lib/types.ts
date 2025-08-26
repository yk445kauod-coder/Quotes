
export interface DocumentItem {
  description: string;
  unit: string;
  quantity: number;
  price: number;
}

export type DocumentType = "quote" | "estimation";

export interface DocumentData {
  id: string; // Firebase Realtime DB key
  docId: string; // User-facing ID, e.g. Q-2024-001
  docType: DocumentType;
  clientName: string;
  subject: string;
  items: DocumentItem[];
  terms?: string;
  paymentMethod?: string;
  createdAt: string; // Stored as ISO string
  subTotal: number;
  taxAmount: number;
  total: number;
}

export interface SettingsData {
  headerImageUrl: string;
  footerText: string;
  defaultTerms?: string;
  defaultPaymentMethod?: string;
  itemsPerPage?: number;
}
