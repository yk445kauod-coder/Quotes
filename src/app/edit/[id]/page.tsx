
import { getDocumentById, getSettings } from "@/lib/firebase-server";
import { CreateDocumentForm } from "@/components/create-document-form";
import { notFound } from "next/navigation";
import type { DocumentData, SettingsData } from "@/lib/types";

// Set revalidation to 0 to ensure data is fresh on every request for this dynamic page.
export const revalidate = 0;

interface EditPageProps {
  params: {
    id: string;
  };
}

// This is now a server component that fetches data server-side.
export default async function EditPage({ params }: EditPageProps) {
  const { id } = params;

  if (!id) {
    // This case should ideally be handled by routing, but as a safeguard:
    notFound();
  }
  
  // Fetch document and settings data concurrently on the server.
  const [document, settings] = await Promise.all([
    getDocumentById(id),
    getSettings()
  ]);

  // If the document doesn't exist, render the not-found page.
  if (!document) {
    notFound();
  }

  // The settings will have default values even if not found in the DB.
  if (!settings) {
    // This is unlikely, but good practice to handle.
    // We can show an error or proceed with form defaults.
    // For now, we'll let the form handle it.
    console.error("Settings could not be loaded for the edit page.");
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
       <h1 className="text-3xl font-bold tracking-tight mb-6">
        تعديل المستند (رقم: {document?.docId})
      </h1>
      {/* 
        The CreateDocumentForm is a client component that now receives all its
        initial data as props from the server component parent.
      */}
      <CreateDocumentForm 
        existingDocument={document} 
        defaultSettings={settings}
      />
    </div>
  );
}
