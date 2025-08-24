export interface DocumentItem {
  description: string;
  unit: string;
  quantity: number;
  price: number;
}

export type DocumentType = "quote" | "estimation";

export interface DocumentData {
  id: string;
  docId: string;
  docType: DocumentType;
  clientName: string;
  subject: string;
  items: DocumentItem[];
  terms: string;
  paymentMethod: string;
  createdAt: string; // Stored as ISO string
  subTotal: number;
  taxAmount: number;
  total: number;
}
