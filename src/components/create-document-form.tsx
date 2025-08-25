
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPreview } from "./document-preview";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  PlusCircle,
  Save,
  FileDown,
  Loader2,
  Wand2,
  Sparkles,
} from "lucide-react";
import { saveDocument, updateDocument } from "@/lib/firebase-client";
import { formatCurrency } from "@/lib/utils";
import type { DocumentData, SettingsData } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { exportToPdf, exportToWord, exportToExcel } from "@/lib/export";
import { Textarea } from "./ui/textarea";
import { useLoading } from "@/context/loading-context";


const formSchema = z.object({
  docType: z.enum(["quote", "estimation"], {
    required_error: "نوع المستند مطلوب.",
  }),
  clientName: z.string().min(1, "اسم الجهة مطلوب."),
  subject: z.string().min(1, "الموضوع مطلوب."),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "وصف البند مطلوب."),
        unit: z.string().min(1, "الوحدة مطلوبة."),
        quantity: z.coerce.number().min(0.01, "الكمية يجب أن تكون أكبر من 0."),
        price: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالباً."),
      })
    )
    .min(1, "يجب إضافة بند واحد على الأقل."),
  terms: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateDocumentFormProps {
    existingDocument?: DocumentData;
    defaultSettings?: SettingsData;
}

export function CreateDocumentForm({ existingDocument, defaultSettings }: CreateDocumentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSuggestingItem, setIsSuggestingItem] = useState<number | null>(null);
  const isEditMode = !!existingDocument;


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode && existingDocument 
        ? {
            ...existingDocument,
            terms: existingDocument.terms || "",
            paymentMethod: existingDocument.paymentMethod || "",
          }
        : {
            docType: "quote",
            clientName: "",
            subject: "",
            items: [{ description: "", unit: "قطعة", quantity: 1, price: 0 }],
            terms: defaultSettings?.defaultTerms || "",
            paymentMethod: defaultSettings?.defaultPaymentMethod || "",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items") || [];
  const subTotal = watchedItems.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.price || 0),
    0
  );
  const taxAmount = subTotal * 0.14;
  const total = subTotal + taxAmount;
  
  const watchedDocType = form.watch("docType");
  const watchedAll = form.watch();


  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    showLoading();
    
    try {
      if (isEditMode && existingDocument) {
        const docToUpdate: DocumentData = {
          ...existingDocument,
          ...values,
          subTotal,
          taxAmount,
          total,
        };
        await updateDocument(existingDocument.id, docToUpdate);
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث المستند في قاعدة البيانات.",
        });
      } else {
        const docToSave: Omit<DocumentData, 'id' | 'docId'> = {
          ...values,
          subTotal,
          taxAmount,
          total,
          createdAt: new Date().toISOString(),
        };
        await saveDocument(docToSave);
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ المستند في قاعدة البيانات.",
        });
      }
      router.push("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل في حفظ المستند.";
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: errorMessage,
      });
      hideLoading();
    } finally {
      setIsSaving(false);
      // hideLoading() will be called when the next page loads if successful
    }
  }

  const handleExport = async (format: 'pdf' | 'word' | 'excel') => {
      setIsExporting(true);
      const element = document.getElementById('document-pdf-export');
      if (!element) {
          toast({ variant: "destructive", title: "خطأ", description: "عنصر المعاينة غير موجود." });
          setIsExporting(false);
          return;
      }
      const docId = isEditMode && existingDocument ? existingDocument.docId : 'document';
      try {
          if (format === 'pdf') {
              await exportToPdf(element, docId);
          } else if (format === 'word') {
              const dataForWord = { ...watchedAll, docId };
              await exportToWord(element, docId);
          } else if (format === 'excel') {
              exportToExcel(watchedItems, docId);
          }
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `فشل تصدير الملف كـ ${format}`;
          toast({ variant: "destructive", title: "خطأ في التصدير", description: errorMessage });
      } finally {
          setIsExporting(false);
      }
  };


  const handleSmartSuggestions = async () => {
    setIsSuggesting(true);
    try {
      const docDetails = {
        docType: form.getValues("docType"),
        subject: form.getValues("subject"),
        clientName: form.getValues("clientName"),
      };

      const response = await fetch('/api/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docDetails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل الاتصال بالـ API');
      }

      const suggestions = await response.json();
      form.setValue("terms", suggestions.suggestedTerms);
      form.setValue("paymentMethod", suggestions.suggestedPaymentMethod);
      toast({
        title: "تم!",
        description: "تم إنشاء الاقتراحات بنجاح.",
      });

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "فشل إنشاء الاقتراحات.";
       toast({
         variant: "destructive",
         title: "خطأ في الذكاء الاصطناعي",
         description: errorMessage,
       });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleItemDescriptionSuggestion = async (index: number) => {
    setIsSuggestingItem(index);
    try {
        const currentDescription = form.getValues(`items.${index}.description`);

        const itemContext = {
            docType: form.getValues("docType"),
            subject: form.getValues("subject"),
            currentItemDescription: currentDescription || "new item",
        };

        const response = await fetch('/api/item-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemContext),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'فشل الاتصال بالـ API');
        }

        const suggestion = await response.json();
        form.setValue(`items.${index}.description`, suggestion);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "فشل إنشاء وصف البند.";
        toast({
            variant: "destructive",
            title: "خطأ في الذكاء الاصطناعي",
            description: errorMessage,
        });
    } finally {
        setIsSuggestingItem(null);
    }
  };
  

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المستند</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المستند</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المستند" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quote">عرض سعر</SelectItem>
                          <SelectItem value="estimation">مقايسة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السادة/</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم العميل أو الجهة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموضوع</FormLabel>
                    <FormControl>
                      <Input placeholder="موضوع المستند" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>البنود</FormLabel>
                <div className="mt-2 space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px] p-2 text-right">م</TableHead>
                        <TableHead className="w-2/5 p-2 text-right">البيان</TableHead>
                        <TableHead className="p-2 text-right">الوحدة</TableHead>
                        <TableHead className="p-2 text-right">الكمية</TableHead>
                        <TableHead className="p-2 text-right">السعر</TableHead>
                        <TableHead className="p-2 text-right">الإجمالي</TableHead>
                        <TableHead className="w-[40px] p-2 text-center">أدوات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="p-1 align-middle">{index + 1}</TableCell>
                          <TableCell className="p-1 align-middle relative group">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormControl>
                                    <Textarea {...field} placeholder="وصف البند" rows={2} />
                                </FormControl>
                              )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={() => handleItemDescriptionSuggestion(index)}
                                disabled={isSuggestingItem === index}
                                title="اقتراح وصف"
                            >
                                {isSuggestingItem === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                          </TableCell>
                           <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit`}
                              render={({ field }) => (
                                <Input {...field} placeholder="الوحدة" className="min-w-[80px]" />
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <Input type="number" {...field} placeholder="الكمية" className="min-w-[80px]" />
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.price`}
                              render={({ field }) => (
                                <Input type="number" {...field} placeholder="السعر" className="min-w-[100px]" />
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-1 align-middle">
                            {formatCurrency(
                              (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0)
                            )}
                          </TableCell>
                          <TableCell className="p-1 align-middle text-center">
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                            title="حذف البند"
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                   <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", unit: "قطعة", quantity: 1, price: 0 })}
                  >
                    <PlusCircle className="ms-2 h-4 w-4" />
                    إضافة بند جديد
                  </Button>
                </div>
              </div>
              
              {watchedDocType === 'quote' && (
                <>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                        <FormLabel htmlFor="terms">الشروط</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleSmartSuggestions} disabled={isSuggesting}>
                            {isSuggesting ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Wand2 className="ms-2 h-4 w-4" />}
                            اقتراح ذكي
                        </Button>
                        </div>
                        <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormControl>
                                    <Textarea {...field} rows={4} placeholder="اكتب الشروط هنا..." />
                                </FormControl>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel htmlFor="paymentMethod">طريقة الدفع</FormLabel>
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormControl>
                                     <Textarea {...field} rows={3} placeholder="اكتب طريقة الدفع هنا..." />
                                </FormControl>
                            )}
                        />
                    </div>
                </>
              )}


              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={() => handleExport('pdf')} disabled={isExporting}>
                   {isExporting ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <FileDown className="ms-2 h-4 w-4" />}
                   PDF
                 </Button>
                 <Button type="button" variant="outline" onClick={() => handleExport('word')} disabled={isExporting}>
                   {isExporting ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <FileDown className="ms-2 h-4 w-4" />}
                   Word
                 </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Save className="ms-2 h-4 w-4" />}
                  {isEditMode ? 'تحديث المستند' : 'حفظ المستند'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="sticky top-20">
        <Card>
          <CardHeader>
            <CardTitle>معاينة المستند</CardTitle>
          </CardHeader>
          <CardContent>
             {/* This div is for the live preview on screen */}
            <div id="document-preview-container" className="w-full aspect-[1/1.414] border rounded-lg shadow-md overflow-auto">
                <DocumentPreview 
                    formData={{...watchedAll, docId: isEditMode && existingDocument ? existingDocument.docId : undefined }} 
                    isForPdf={false} 
                />
            </div>
             {/* This div is hidden and used only for PDF export */}
            <div className="hidden">
                 <div id="document-pdf-export" style={{ width: '210mm' }}>
                    <DocumentPreview 
                        formData={{...watchedAll, docId: isEditMode && existingDocument ? existingDocument.docId : undefined }} 
                        isForPdf={true} 
                    />
                 </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
