import { getDocumentById, getSettings } from "@/lib/firebase-server";
import { CreateDocumentForm } from "@/components/create-document-form";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface EditPageProps {
  params: {
    id: string;
  };
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = params;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }
  
  // Settings can also be fetched on the server
  const settings = await getSettings();

  return (
    <div className="container mx-auto p-4 md:p-8">
       <h1 className="text-3xl font-bold tracking-tight mb-6">
        تعديل المستند (رقم: {document?.docId})
      </h1>
      <CreateDocumentForm 
        existingDocument={document} 
        defaultSettings={settings}
      />
    </div>
  );
}
