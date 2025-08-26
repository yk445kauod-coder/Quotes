
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import { saveSettings } from "@/lib/firebase-client";
import type { SettingsData } from "@/lib/types";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  headerImageUrl: z.string().url("يجب أن يكون رابطًا صحيحًا."),
  footerText: z.string().min(1, "نص التذييل مطلوب."),
  defaultTerms: z.string().optional(),
  defaultPaymentMethod: z.string().optional(),
  itemsPerPage: z.coerce
    .number()
    .min(1, "يجب أن يكون العدد 1 على الأقل.")
    .max(17, "يجب أن يكون العدد 17 على الأكثر.")
    .optional(),
  showIndexColumn: z.boolean().optional(),
  showUnitColumn: z.boolean().optional(),
  showQuantityColumn: z.boolean().optional(),
  showPriceColumn: z.boolean().optional(),
  showTotalColumn: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
    initialSettings: SettingsData;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        ...initialSettings,
        itemsPerPage: initialSettings.itemsPerPage || 13,
        showIndexColumn: initialSettings.showIndexColumn !== false,
        showUnitColumn: initialSettings.showUnitColumn !== false,
        showQuantityColumn: initialSettings.showQuantityColumn !== false,
        showPriceColumn: initialSettings.showPriceColumn !== false,
        showTotalColumn: initialSettings.showTotalColumn !== false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    try {
      await saveSettings(values as SettingsData);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات المستند.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "فشل حفظ الإعدادات.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>إعدادات المستند</CardTitle>
          <CardDescription>
            تغيير البيانات التي تظهر في رأس وتذييل كل المستندات، بالإضافة إلى القيم الافتراضية والتحكم في التنسيق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="headerImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط صورة الشعار (Header)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص التذييل (Footer)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اسم الشركة ومعلومات الاتصال..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشروط الافتراضية</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="الشروط والأحكام التي تظهر عند إنشاء مستند جديد..."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultPaymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الدفع الافتراضية</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="طريقة الدفع التي تظهر عند إنشاء مستند جديد..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="itemsPerPage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد البنود في كل صفحة</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="17" {...field} />
                    </FormControl>
                     <FormDescription>
                      الحد الأقصى لعدد البنود التي تظهر في كل صفحة من المستند (بين 1 و 17).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              <div className="space-y-4">
                  <h3 className="text-lg font-medium">إعدادات الأعمدة</h3>
                  <FormDescription>
                    تحكم في الأعمدة التي تظهر في جدول البنود. عمود "البيان" يظهر دائماً.
                  </FormDescription>
                  <FormField
                    control={form.control}
                    name="showIndexColumn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>إظهار عمود الرقم (م)</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showUnitColumn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>إظهار عمود الوحدة</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showQuantityColumn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>إظهار عمود الكمية/العدد</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showPriceColumn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>إظهار عمود السعر</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showTotalColumn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>إظهار عمود الإجمالي</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
              </div>


              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Save className="ms-2 h-4 w-4" />}
                  حفظ الإعدادات
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}
