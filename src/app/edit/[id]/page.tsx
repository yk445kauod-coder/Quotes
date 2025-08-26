
"use client";

import { getDocumentById, getSettings } from "@/lib/firebase-client";
import { CreateDocumentForm } from "@/components/create-document-form";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import type { DocumentData, SettingsData } from "@/lib/types";

interface EditPageProps {
  params: {
    id: string;
  };
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = params;
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [doc, appSettings] = await Promise.all([
          getDocumentById(id),
          getSettings()
        ]);

        if (!doc) {
          notFound();
          return;
        }

        setDocument(doc);
        setSettings(appSettings);
      } catch (error) {
        console.error("Failed to fetch document or settings:", error);
        // Optionally, handle the error state in the UI
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
        {/* You could add skeleton loaders here */}
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
