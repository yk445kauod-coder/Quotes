
"use client";

import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import type { DocumentData, SettingsData } from "@/lib/types";
import React, { useState, useEffect } from "react";
import { getSettings } from "@/lib/firebase-client";
import { Skeleton } from "./ui/skeleton";


interface DocumentPreviewProps {
  formData: Partial<DocumentData>;
}

export function DocumentPreview({ formData }: DocumentPreviewProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to load settings for preview:", error);
        setSettings({
            headerImageUrl: "https://placehold.co/700x100.png",
            footerText: "Error loading settings"
        });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const {
    docId,
    docType = "quote",
    clientName = "اسم الجهة",
    subject = "موضوع المستند",
    items = [],
    terms = "",
    paymentMethod = "",
    subTotal = 0,
    taxAmount = 0,
    total = 0,
  } = formData;

  const docTypeName = docType === 'quote' ? 'عرض سعر' : 'مقايسة';
  const today = new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  const itemsToRender = (items || []);
  const docIdText = docId ? docId : '[سيتم إنشاؤه عند الحفظ]';
  
  if (loading) {
      return (
          <div className="p-8 space-y-4 bg-white rounded-lg shadow-lg">
              <Skeleton className="h-[100px] w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-20 w-1/2" />
                <Skeleton className="h-20 w-1/3" />
              </div>
              <Skeleton className="h-10 w-full" />
          </div>
      )
  }

  return (
    <div id="document-preview" className="bg-white text-black font-body text-sm flex flex-col p-8 rounded-lg shadow-lg">
        <header className="w-full mb-4">
            {settings?.headerImageUrl && (
                <Image
                    src={settings.headerImageUrl}
                    alt="Company Header"
                    width={794}
                    height={120}
                    className="w-full h-auto object-contain"
                    data-ai-hint="company logo"
                    priority
                    unoptimized
                />
            )}
        </header>
        
        <div className="text-center my-4">
            <h2 className="text-xl font-bold underline">{docTypeName}</h2>
        </div>

        <div className="flex justify-between mb-4 text-sm">
            <span>التاريخ: {today}</span>
            <span>{docTypeName} رقم: {docIdText}</span>
        </div>
        
        <div className="mb-4 text-sm">
            <p><span className="font-bold">السادة/</span> {clientName}</p>
            <p><span className="font-bold">الموضوع:</span> {subject}</p>
        </div>

        <main className="flex-grow flex flex-col">
            <div className="flex-grow overflow-auto">
                <table className="w-full border-collapse text-right document-preview-table mb-2 text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-1 w-[5%]">م</th>
                            <th className="border p-1 w-[45%]">{docType === 'quote' ? 'البيان' : 'البند'}</th>
                            <th className="border p-1 w-[10%]">الوحدة</th>
                            <th className="border p-1 w-[10%]">{docType === 'quote' ? 'العدد' : 'الكمية'}</th>
                            <th className="border p-1 w-[15%]">السعر</th>
                            <th className="border p-1 w-[15%]">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsToRender.map((item, index) => (
                            <tr key={index}>
                                <td className="border p-1 align-top text-center">{index + 1}</td>
                                <td className="border p-1 align-top whitespace-pre-wrap">{item.description || ''}</td>
                                <td className="border p-1 align-top text-center">{item.unit}</td>
                                <td className="border p-1 align-top text-center">{item.quantity}</td>
                                <td className="border p-1 align-top text-right">{formatCurrency(item.price || 0)}</td>
                                <td className="border p-1 align-top text-right">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex justify-between items-start gap-4 text-xs mt-auto pt-4">
                <div className="w-3/5">
                    {docType === 'quote' && (
                        <>
                            <h3 className="font-bold text-sm mb-1">الشروط:</h3>
                            <div className="whitespace-pre-wrap">{terms || ''}</div>
                            <h3 className="font-bold text-sm mt-2 mb-1">طريقة الدفع:</h3>
                            <div className="whitespace-pre-wrap">{paymentMethod || ''}</div>
                        </>
                    )}
                </div>
                <div className="w-2/5 max-w-xs">
                    <table className="w-full border-collapse text-right document-preview-table">
                        <tbody>
                            <tr>
                                <td className="border p-1 font-bold">المجموع</td>
                                <td className="border p-1 text-right">{formatCurrency(subTotal)}</td>
                            </tr>
                            <tr>
                                <td className="border p-1 font-bold">الضريبة (14%)</td>
                                <td className="border p-1 text-right">{formatCurrency(taxAmount)}</td>
                            </tr>
                            <tr>
                                <td className="border p-1 font-bold bg-gray-100">الإجمالي الكلي</td>
                                <td className="border p-1 font-bold bg-gray-100 text-right">{formatCurrency(total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
        
        <footer className="w-full mt-4 p-2 border-t-2 border-black text-center text-xs">
           {settings?.footerText && <p className="whitespace-pre-wrap">{settings.footerText}</p>}
        </footer>
    </div>
  );
}
