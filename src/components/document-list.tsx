
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, FileDown, Loader2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { DocumentData } from "@/lib/types";
import { deleteDocument, subscribeToDocuments } from "@/lib/firebase-client";
import { exportToPdf, exportToWord, exportToExcel } from "@/lib/export";
import { DocumentPreview } from "./document-preview";

interface DocumentListProps {
  initialDocuments: DocumentData[];
}

export function DocumentList({ initialDocuments }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentData[]>(initialDocuments);
  const [loading, setLoading] = useState(false); // No initial loading
  const { toast } = useToast();
  const [exportingDoc, setExportingDoc] = useState<DocumentData | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Subscribe to real-time updates after the initial server render
    const unsubscribe = subscribeToDocuments((docs) => {
      setDocuments(docs);
    });
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);
  
  const handleEdit = (id: string) => {
    router.push(`/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const originalDocuments = [...documents];
    setDocuments(documents.filter((doc) => doc.id !== id));

    try {
        await deleteDocument(id);
        toast({
            title: "تم الحذف",
            description: "تم حذف المستند بنجاح.",
        });
    } catch (err) {
        setDocuments(originalDocuments);
        const errorMessage = err instanceof Error ? err.message : "فشل في حذف المستند.";
        toast({
            variant: "destructive",
            title: "خطأ",
            description: errorMessage,
        });
    }
  };

  const handleExport = async (doc: DocumentData, format: 'pdf' | 'word' | 'excel') => {
    setExportingDoc(doc);
    // Wait for the state to update and the component to re-render
    await new Promise(resolve => setTimeout(resolve, 0)); 
    
    const exportContainer = exportContainerRef.current;
    if (!exportContainer) {
        toast({ variant: "destructive", title: "خطأ", description: "عنصر التصدير غير موجود." });
        setExportingDoc(null);
        return;
    }

    try {
        if (format === 'pdf') {
            await exportToPdf(exportContainer, doc.docId);
        } else if (format === 'word') {
            await exportToWord(exportContainer, doc.docId);
        } else if (format === 'excel') {
            exportToExcel(doc.items, doc.docId);
        }
        toast({ title: "تم التصدير", description: `تم تصدير المستند كـ ${format.toUpperCase()}.` });
    } catch (e) {
        toast({ variant: "destructive", title: "خطأ في التصدير", description: "فشل تصدير المستند." });
    } finally {
        setExportingDoc(null);
    }
  };

  const filteredDocuments = documents.filter(doc => {
      const query = searchQuery.toLowerCase();
      return (
        doc.docId.toLowerCase().includes(query) ||
        doc.clientName.toLowerCase().includes(query) ||
        doc.subject.toLowerCase().includes(query)
      );
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>المستندات</CardTitle>
        <CardDescription>
            قائمة بأحدث عروض الأسعار والمقايسات.
        </CardDescription>
         <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مستند (بالرقم، العميل، أو الموضوع)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : documents.length === 0 ? (
           <div className="text-center text-gray-500 py-8">
            <p>لا توجد مستندات لعرضها.</p>
            <p>ابدأ بإنشاء مستند جديد.</p>
          </div>
        ) : (
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المستند</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الموضوع</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-left">الإجمالي</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.docId}</TableCell>
                  <TableCell>{doc.clientName}</TableCell>
                  <TableCell>{doc.subject}</TableCell>
                  <TableCell>
                    <Badge variant={doc.docType === 'quote' ? 'default' : 'secondary'}>
                      {doc.docType === 'quote' ? 'عرض سعر' : 'مقايسة'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="text-left">{formatCurrency(doc.total)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(doc.id)}>
                            <Edit className="me-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          
                           <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FileDown className="me-2 h-4 w-4" />
                                <span>تصدير</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                 <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleExport(doc, 'pdf')}>
                                      <span>تصدير PDF</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport(doc, 'word')}>
                                      <span>تصدير Word</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport(doc, 'excel')}>
                                      <span>تصدير Excel</span>
                                    </DropdownMenuItem>
                                 </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                           </DropdownMenuSub>

                           <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="me-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المستند بشكل دائم من خوادمنا.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doc.id)}>
                            متابعة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {filteredDocuments.length === 0 && searchQuery && (
             <div className="text-center text-gray-500 py-8">
               <p>لا توجد نتائج بحث تطابق "{searchQuery}".</p>
             </div>
           )}
        </div>
        )}
       
        {/* Hidden container for exporting */}
        {exportingDoc && (
          <div className="hidden">
            <div ref={exportContainerRef} style={{ width: '210mm' }}>
                <DocumentPreview formData={exportingDoc} isForPdf={true} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
