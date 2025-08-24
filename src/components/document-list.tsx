"use client";

import { useState } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Eye, FileDown } from "lucide-react";
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
import { deleteDocument } from "@/lib/actions";

interface DocumentListProps {
  initialDocuments: DocumentData[];
}

export function DocumentList({ initialDocuments }: DocumentListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const originalDocuments = [...documents];
    setDocuments(documents.filter((doc) => doc.id !== id));

    const result = await deleteDocument(id);
    if (!result.success) {
      setDocuments(originalDocuments);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.error,
      });
    } else {
       toast({
        title: "تم الحذف",
        description: "تم حذف المستند بنجاح.",
      });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>لا توجد مستندات لعرضها.</p>
        <p>ابدأ بإنشاء مستند جديد.</p>
      </div>
    );
  }

  return (
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
                      <DropdownMenuItem>
                        <Eye className="me-2 h-4 w-4" />
                        عرض
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileDown className="me-2 h-4 w-4" />
                        تصدير
                      </DropdownMenuItem>
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
  );
}
