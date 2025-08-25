"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import { saveSettings } from "@/lib/firebase-client";
import type { SettingsData } from "@/lib/types";

const formSchema = z.object({
  headerImageUrl: z.string().url("يجب أن يكون رابطًا صحيحًا."),
  footerText: z.string().min(1, "نص التذييل مطلوب."),
  defaultTerms: z.string().optional(),
  defaultPaymentMethod: z.string().optional(),
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
    defaultValues: initialSettings,
  });

  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    try {
      await saveSettings(values);
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
            تغيير البيانات التي تظهر في رأس وتذييل كل المستندات، بالإضافة إلى القيم الافتراضية.
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
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
