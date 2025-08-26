
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
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { saveDocument, updateDocument } from "@/lib/firebase-client";
import { formatCurrency } from "@/lib/utils";
import type { DocumentData, SettingsData } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { exportToPdf, exportToWord, exportToExcel } from "@/lib/export";
import { Textarea } from "./ui/textarea";
import { useLoading } from "@/context/loading-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";


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
    defaultSettings: SettingsData;
}

export function CreateDocumentForm({ existingDocument, defaultSettings }: CreateDocumentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const isEditMode = !!existingDocument;

  // State for column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    showIndexColumn: true,
    showUnitColumn: true,
    showQuantityColumn: true,
    showPriceColumn: true,
    showTotalColumn: true,
  });

  type ColumnKey = keyof typeof columnVisibility;

  const toggleColumn = (col: ColumnKey) => {
    setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };


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
            paymentMethod: defaultSettings?.defaultPaymentMethod || "قدا او بأمر دفع على حساب 3913070223277800019 البنك الاهلي فرع كفر الدوار او حساب رقم 5590001000000924 بنك مصر فرع المنتزه",
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
  
  const watchedAll = form.watch();

  const currentDocumentData: DocumentData = {
    id: existingDocument?.id || '',
    docId: existingDocument?.docId || '',
    ...watchedAll,
    subTotal,
    taxAmount,
    total,
    createdAt: existingDocument?.createdAt || new Date().toISOString(),
  };
  
  // Auto-Save Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoSaving && isEditMode && existingDocument) {
      interval = setInterval(async () => {
        try {
          const values = form.getValues();
          const docToUpdate: DocumentData = {
            ...existingDocument,
            ...values,
            subTotal,
            taxAmount,
            total,
          };
          await updateDocument(existingDocument.id, docToUpdate);
          toast({
            title: "تم الحفظ تلقائياً",
            description: `تم حفظ المستند ${existingDocument.docId} في ${new Date().toLocaleTimeString('ar-EG')}`,
            duration: 2000,
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "فشل الحفظ التلقائي",
            description: "حدث خطأ أثناء محاولة حفظ المستند تلقائياً.",
          });
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => clearInterval(interval); // Cleanup on unmount or if auto-save is turned off
  }, [isAutoSaving, isEditMode, existingDocument, form, subTotal, taxAmount, total, toast]);


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
      const docId = currentDocumentData.docId || 'document';
      
      const elementToExport = document.getElementById('document-preview-container');
      if (!elementToExport) {
        toast({ variant: "destructive", title: "خطأ", description: "عنصر المعاينة غير موجود." });
        setIsExporting(false);
        return;
      }

      try {
          if (format === 'pdf') {
              await exportToPdf(elementToExport, docId);
          } else if (format === 'word') {
              await exportToWord(elementToExport, docId);
          } else if (format === 'excel') {
              exportToExcel(watchedItems, docId);
          }
           toast({ title: "نجاح", description: `جاري تجهيز ملف ${format.toUpperCase()}...` });
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `فشل تصدير الملف كـ ${format}`;
          toast({ variant: "destructive", title: "خطأ في التصدير", description: errorMessage });
      } finally {
          setIsExporting(false);
      }
  };
  
    const ColumnToggleButton = ({ col, label }: { col: ColumnKey, label: string }) => {
        const isVisible = columnVisibility[col];
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant={isVisible ? "outline" : "secondary"}
                            size="icon"
                            onClick={() => toggleColumn(col)}
                            className="h-8 w-8"
                        >
                            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isVisible ? `إخفاء عمود ${label}` : `إظهار عمود ${label}`}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>تفاصيل المستند</CardTitle>
            {isEditMode && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id="auto-save"
                        checked={isAutoSaving}
                        onCheckedChange={setIsAutoSaving}
                    />
                    <Label htmlFor="auto-save" className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        حفظ تلقائي
                    </Label>
                </div>
            )}
           </div>
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
                      <Textarea placeholder="اسم العميل أو الجهة" {...field} rows={2}/>
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
                <div className="flex justify-between items-center mb-2">
                    <FormLabel>البنود</FormLabel>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">إظهار/إخفاء:</span>
                        <ColumnToggleButton col="showIndexColumn" label="الرقم" />
                        <ColumnToggleButton col="showUnitColumn" label="الوحدة" />
                        <ColumnToggleButton col="showQuantityColumn" label="الكمية" />
                        <ColumnToggleButton col="showPriceColumn" label="السعر" />
                        <ColumnToggleButton col="showTotalColumn" label="الإجمالي" />
                    </div>
                </div>

                <div className="mt-2 space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnVisibility.showIndexColumn && <TableHead className="w-[40px] p-2 text-right">م</TableHead>}
                        <TableHead className="w-2/5 p-2 text-right">البيان</TableHead>
                        {columnVisibility.showUnitColumn && <TableHead className="p-2 text-right">الوحدة</TableHead>}
                        {columnVisibility.showQuantityColumn && <TableHead className="p-2 text-right">الكمية</TableHead>}
                        {columnVisibility.showPriceColumn && <TableHead className="p-2 text-right">السعر</TableHead>}
                        {columnVisibility.showTotalColumn && <TableHead className="p-2 text-right">الإجمالي</TableHead>}
                        <TableHead className="w-[40px] p-2 text-center">أدوات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          {columnVisibility.showIndexColumn && <TableCell className="p-1 align-middle">{index + 1}</TableCell>}
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
                          </TableCell>
                           {columnVisibility.showUnitColumn && <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit`}
                              render={({ field }) => (
                                <Input {...field} placeholder="الوحدة" className="min-w-[80px]" />
                              )}
                            />
                          </TableCell>}
                          {columnVisibility.showQuantityColumn && <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <Input type="number" {...field} placeholder="الكمية" className="min-w-[80px]" />
                              )}
                            />
                          </TableCell>}
                          {columnVisibility.showPriceColumn && <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.price`}
                              render={({ field }) => (
                                <Input type="number" {...field} placeholder="السعر" className="min-w-[100px]" />
                              )}
                            />
                          </TableCell>}
                          {columnVisibility.showTotalColumn && <TableCell className="p-1 align-middle">
                            {formatCurrency(
                              (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0)
                            )}
                          </TableCell>}
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
              
              {watchedAll.docType === 'quote' && (
                <>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel htmlFor="terms">الشروط</FormLabel>
                        </div>
                        <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormControl>
                                    <Textarea 
                                        {...field} 
                                        rows={4} 
                                        placeholder="اكتب الشروط هنا..." 
                                    />
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
                                    <Textarea 
                                        {...field} 
                                        rows={3} 
                                        placeholder="اكتب طريقة الدفع هنا..."
                                    />
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
            <div id="document-export-target" className="no-print">
              <div className="w-full bg-gray-100 p-8 rounded-lg shadow-inner overflow-auto max-h-[80vh]">
                  <div id="document-preview-container">
                      <DocumentPreview 
                          formData={currentDocumentData} 
                          settings={defaultSettings}
                          columnVisibility={columnVisibility}
                      />
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
