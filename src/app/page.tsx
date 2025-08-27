import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/document-list";
import { LoadingLink } from "@/components/loading-link";


// No data is fetched on the server anymore. Revalidation is not needed.
// The DocumentList component will fetch its own data on the client.
export default function DashboardPage() {
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

      {/* The DocumentList component now manages its own data fetching and loading state. */}
      <DocumentList />
      
    </div>
  );
}
