
"use client";

import { getDocumentById, getSettings } from "@/lib/firebase-client";
import { CreateDocumentForm } from "@/components/create-document-form";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DocumentData, SettingsData } from "@/lib/types";

// This component is now a client component and handles its own data fetching.
export default function EditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure we only fetch if the id is a valid string
    if (!id) {
        setLoading(false);
        setError("Invalid document ID.");
        return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [doc, appSettings] = await Promise.all([
          getDocumentById(id),
          getSettings()
        ]);

        if (!doc) {
          notFound(); // This will render the not-found page
          return;
        }

        setDocument(doc);
        setSettings(appSettings);
      } catch (err) {
        console.error("Failed to fetch document or settings:", err);
        setError("Failed to load document data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  if (loading) {
    // You can replace this with a more sophisticated loading skeleton component
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          جاري تحميل المستند...
        </h1>
        {/* You could add skeleton loaders here for a better UX */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center text-destructive">
        <h1 className="text-3xl font-bold tracking-tight mb-6">خطأ</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!document) {
    // This case will be handled by notFound() but as a fallback
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
       <h1 className="text-3xl font-bold tracking-tight mb-6">
        تعديل المستند (رقم: {document?.docId})
      </h1>
      <CreateDocumentForm 
        existingDocument={document} 
        defaultSettings={settings as SettingsData}
      />
    </div>
  );
}
