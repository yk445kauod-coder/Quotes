import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/document-list";
import { getDocuments } from "@/lib/firebase-server";
import type { DocumentData } from "@/lib/types";
import { LoadingLink } from "@/components/loading-link";


export const revalidate = 0; // Revalidate on every request

export default async function DashboardPage() {
  // Fetch initial documents on the server for the initial page load.
  const documents: DocumentData[] = await getDocuments();

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">
          لوحة التحكم
        </h1>
        <div className="flex items-center space-x-2">
          <LoadingLink href="/create">
            <Button>
              <PlusCircle className="ms-2 h-4 w-4" />
              إنشاء مستند جديد
            </Button>
          </LoadingLink>
        </div>
      </div>

      {/* Pass the server-fetched documents to the client component */}
      <DocumentList initialDocuments={documents} />
      
    </div>
  );
}
