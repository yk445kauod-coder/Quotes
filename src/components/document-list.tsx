"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, FileDown, Loader2 } from "lucide-react";
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
import { getDocuments, deleteDocument } from "@/lib/firebase-client";
import { exportToPdf, exportToWord, exportToExcel } from "@/lib/export";
import { DocumentPreview } from "./document-preview";

export function DocumentList() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [exportingDoc, setExportingDoc] = useState<DocumentData | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const unsubscribe = getDocuments((docs) => {
          setDocuments(docs);
          setLoading(false);
        });
        // In a real app, you might want to return the unsubscribe function
        // from the useEffect cleanup to stop listening when the component unmounts.
        // For simplicity, we're not doing that here.
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "فشل في جلب المستندات.";
        setError(errorMessage);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: errorMessage,
        });
      }
    };

    fetchDocuments();
  }, [toast]);

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


  if (loading) {
    return (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }
  
  if (error) {
     return (
      <div className="text-center text-red-500 py-8">
        <p>حدث خطأ أثناء تحميل المستندات:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>لا توجد مستندات لعرضها.</p>
        <p>ابدأ بإنشاء مستند جديد.</p>
      </div>
    );
  }

  return (
    <>
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
          {documents.map((doc) => (
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
                      <DropdownMenuItem asChild>
                        <Link href={`/edit/${doc.id}`}>
                            <Edit className="me-2 h-4 w-4" />
                            تعديل
                        </Link>
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
    </div>
    {/* Hidden container for exporting */}
    {exportingDoc && (
      <div className="hidden">
        <div ref={exportContainerRef}>
          <DocumentPreview formData={exportingDoc} isForPdf={true} />
        </div>
      </div>
    )}
    </>
  );
}
