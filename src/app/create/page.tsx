import { CreateDocumentForm } from "@/components/create-document-form";

export default function CreatePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        إنشاء مستند جديد
      </h1>
      <CreateDocumentForm />
    </div>
  );
}
