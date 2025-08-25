
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CreateDocumentForm } from "@/components/create-document-form";
import { getDocumentById } from "@/lib/firebase-client";
import type { DocumentData } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function EditForm() {
  const params = useParams();
  const id = params.id as string;
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchDocument = async () => {
        try {
          const doc = await getDocumentById(id);
          if (doc) {
            setDocument(doc);
          } else {
            setError("لم يتم العثور على المستند.");
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "فشل في جلب المستند."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchDocument();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold text-destructive">خطأ</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        تعديل المستند (رقم: {document?.docId})
      </h1>
      {document && <CreateDocumentForm existingDocument={document} />}
    </div>
  );
}
