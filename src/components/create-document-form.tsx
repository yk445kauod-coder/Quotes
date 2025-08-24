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
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles,
  Save,
  FileDown,
  Loader2,
  Wand2,
} from "lucide-react";
import { fetchSmartSuggestionsAction, saveDocument, fetchItemDescriptionSuggestionAction } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import type { DocumentType } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import html2pdf from "html2pdf.js";

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

export function CreateDocumentForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [suggestingItemIndex, setSuggestingItemIndex] = useState<number | null>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docType: "quote",
      clientName: "",
      subject: "",
      items: [{ description: "", unit: "قطعة", quantity: 1, price: 0 }],
      terms: "الأسعار شاملة الضريبة\nصالحة لمدة 30 يوم\nالتسليم خلال 15 يوم عمل",
      paymentMethod: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
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
    const result = await saveDocument({ ...values, subTotal, taxAmount, total });
    setIsSaving(false);
    if (result.success) {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ المستند في قاعدة البيانات.",
      });
      router.push("/");
    } else {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: result.error,
      });
    }
  }

  async function handleGetSuggestions() {
    setIsSuggesting(true);
    const documentDetails = `العميل: ${form.getValues("clientName")}, الموضوع: ${form.getValues("subject")}, البنود: ${form.getValues("items").map(i => i.description).join(', ')}`;
    const result = await fetchSmartSuggestionsAction({
      documentType: form.getValues("docType") as DocumentType,
      documentDetails,
    });
    setIsSuggesting(false);
    if (result.success && result.data) {
      form.setValue("terms", result.data.termsAndConditions);
      form.setValue("paymentMethod", result.data.paymentMethods);
      toast({
        title: "تم جلب الاقتراحات",
        description: "تم تحديث حقول الشروط وطرق الدفع.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.error,
      });
    }
  }

  async function handleGetItemDescription(index: number) {
    const itemQuery = form.getValues(`items.${index}.description`);
    if (!itemQuery) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "يرجى كتابة كلمة أو كلمتين عن البند أولاً.",
        });
        return;
    }
    setSuggestingItemIndex(index);
    const documentContext = `العميل: ${form.getValues("clientName")}, الموضوع: ${form.getValues("subject")}`;
    const result = await fetchItemDescriptionSuggestionAction({
        itemQuery,
        documentContext,
    });
    setSuggestingItemIndex(null);
    if (result.success && result.data) {
        form.setValue(`items.${index}.description`, result.data.description);
        toast({
            title: "تم اقتراح الوصف",
            description: "تم تحديث وصف البند.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: result.error,
        });
    }
  }

  const handleExportPdf = () => {
    setIsPrinting(true);
    const element = document.getElementById('document-preview-container');
    const docId = `${form.getValues('docType')}-${form.getValues('clientName')}`.replace(/\s/g, '_');
    const opt = {
      margin: 0,
      filename: `${docId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => setIsPrinting(false)).catch(() => setIsPrinting(false));
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
                        defaultValue={field.value}
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
                    <FormLabel>السادة/الشركة (اسم الجهة)</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم العميل أو الشركة" {...field} />
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
                        <TableHead className="w-[80px] p-2 text-center">أدوات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="p-1 align-middle">{index + 1}</TableCell>
                          <TableCell className="p-1 align-middle">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <Textarea {...field} placeholder="وصف البند" className="min-w-[150px]" rows={2} />
                              )}
                            />
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
                            <div className="flex flex-col items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGetItemDescription(index)}
                                  disabled={suggestingItemIndex === index}
                                  title="اقتراح وصف"
                                >
                                  {suggestingItemIndex === index ? (
                                     <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                     <Wand2 className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
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
                            </div>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="terms">{watchedDocType === 'quote' ? 'الشروط' : 'ملاحظات'}</FormLabel>
                   <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGetSuggestions}
                    disabled={isSuggesting}
                  >
                    {isSuggesting ? (
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="ms-2 h-4 w-4" />
                    )}
                    اقتراح ذكي
                  </Button>
                </div>
                 <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <Textarea
                      id="terms"
                      placeholder={watchedDocType === 'quote' ? 'الشروط والأحكام...' : 'ملاحظات إضافية...'}
                      {...field}
                      rows={4}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="paymentMethod">طريقة الدفع</FormLabel>
                 <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Textarea
                      id="paymentMethod"
                      placeholder="تفاصيل الحسابات البنكية أو طرق الدفع الأخرى..."
                      {...field}
                      rows={4}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={handleExportPdf} disabled={isPrinting}>
                   {isPrinting ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <FileDown className="ms-2 h-4 w-4" />}
                   تصدير PDF
                 </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Save className="ms-2 h-4 w-4" />}
                  حفظ المستند
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
            <div id="document-preview-container" className="w-full aspect-[1/1.414] border rounded-lg shadow-md overflow-hidden">
                <DocumentPreview formData={watchedAll} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
