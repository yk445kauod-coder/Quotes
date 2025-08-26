
"use client";

import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import type { DocumentData, SettingsData, DocumentItem } from "@/lib/types";
import React, { useState, useEffect } from "react";
import { getSettings as getClientSettings } from "@/lib/firebase-client";
import { Skeleton } from "./ui/skeleton";

interface DocumentPreviewProps {
  formData: Partial<DocumentData>;
  settings?: SettingsData | null;
}

export function DocumentPreview({ formData, settings: propSettings }: DocumentPreviewProps) {
  const [settings, setSettings] = useState<SettingsData | null | undefined>(propSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      if (propSettings === undefined) {
        try {
          const fetchedSettings = await getClientSettings();
          setSettings(fetchedSettings);
        } catch (error) {
          console.error("Failed to load settings for preview:", error);
          setSettings(null); // Set to null on error to use defaults
        } finally {
          setLoading(false);
        }
      } else {
        setSettings(propSettings);
        setLoading(false);
      }
    }
    loadSettings();
  }, [propSettings]);

  if (loading) {
      return (
          <div className="a4-page">
              <Skeleton className="h-[100px] w-full" />
              <div className="flex justify-between mt-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-6 w-1/2 mt-4" />
              <Skeleton className="h-40 w-full mt-4" />
          </div>
      )
  }

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
  
  const resolvedSettings = {
    headerImageUrl: settings?.headerImageUrl || "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527",
    footerText: settings?.footerText || "Footer text not set",
    itemsPerPage: settings?.itemsPerPage || 17,
  }

  const docTypeName = docType === 'quote' ? 'عرض سعر' : 'مقايسة';
  const today = new Date().toLocaleDateString('ar-EG-u-nu-arab', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const docIdText = docId ? docId : '[سيتم إنشاؤه عند الحفظ]';

  // Smart Paging Logic:
  const itemChunks: DocumentItem[][] = [];
  if (items && items.length > 0) {
      let currentIndex = 0;
      let pageIndex = 0;
      const LONG_TEXT_THRESHOLD = 200;

      while (currentIndex < items.length) {
          let pageSize = resolvedSettings.itemsPerPage;
          
          // Determine the range of items for the potential page
          const potentialEndIndex = currentIndex + pageSize;
          const potentialChunk = items.slice(currentIndex, potentialEndIndex);
          
          // Check if any item in this potential chunk has long text
          const hasLongText = potentialChunk.some(
              item => (item.description || '').length > LONG_TEXT_THRESHOLD
          );

          if (hasLongText) {
              // Apply special sizing if long text is detected
              pageSize = pageIndex === 0 ? 6 : 8; // 6 for first page, 8 for subsequent
          }

          const chunk = items.slice(currentIndex, currentIndex + pageSize);
          itemChunks.push(chunk);
          currentIndex += chunk.length;
          pageIndex++;
      }
  } else {
      // Ensure there is at least one page even if there are no items
      itemChunks.push([]);
  }

  const totalPages = itemChunks.length;

  const renderTable = (chunk: DocumentItem[], startIndex: number) => (
      <table className="w-full border-collapse text-right mt-4">
          <thead>
              <tr className="bg-gray-100">
                  <th className="border p-1 w-[5%] text-center align-middle">م</th>
                  <th className="border p-1 w-[45%] text-right align-middle">{docType === 'quote' ? 'البيان' : 'البند'}</th>
                  <th className="border p-1 w-[10%] text-center align-middle">الوحدة</th>
                  <th className="border p-1 w-[10%] text-center align-middle">{docType === 'quote' ? 'العدد' : 'الكمية'}</th>
                  <th className="border p-1 w-[15%] text-center align-middle">السعر</th>
                  <th className="border p-1 w-[15%] text-center align-middle">الإجمالي</th>
              </tr>
          </thead>
          <tbody>
              {chunk.map((item, index) => (
                  <tr key={startIndex + index}>
                      <td className="border p-1 align-middle text-center">{startIndex + index + 1}</td>
                      <td className="border p-1 align-top whitespace-pre-wrap">{item.description || ''}</td>
                      <td className="border p-1 align-middle text-center">{item.unit}</td>
                      <td className="border p-1 align-middle text-center">{item.quantity}</td>
                      <td className="border p-1 align-middle text-center">{formatCurrency(item.price || 0)}</td>
                      <td className="border p-1 align-middle text-center">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                  </tr>
              ))}
          </tbody>
      </table>
  );

  const renderSummaryAndTerms = () => (
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
              <table className="w-full border-collapse text-right">
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
  );

  return (
    <>
      {itemChunks.map((chunk, pageIndex) => {
        const isLastPage = pageIndex === totalPages - 1;
        const startIndex = itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0);

        return (
          <div key={pageIndex} className="a4-page">
            <header className="w-full">
              {pageIndex === 0 && resolvedSettings?.headerImageUrl && (
                  <Image
                    src={resolvedSettings.headerImageUrl}
                    alt="Company Header"
                    width={794}
                    height={100}
                    className="w-full h-auto object-contain mb-2"
                    data-ai-hint="company logo"
                    priority
                    unoptimized
                  />
              )}
               {pageIndex === 0 && (
                  <>
                      <div className="text-center my-2">
                          <h2 className="text-xl font-bold underline">{docTypeName}</h2>
                      </div>
                      <div className="flex justify-between mb-2 text-sm">
                          <span>التاريخ: {today}</span>
                          <span>{docTypeName} رقم: {docIdText}</span>
                      </div>
                      <div className="mb-2 text-sm">
                          <p><span className="font-bold">السادة/</span> {clientName}</p>
                          <p><span className="font-bold">الموضوع:</span> {subject}</p>
                      </div>
                  </>
               )}
            </header>

            <main>
              {renderTable(chunk, startIndex)}
              {isLastPage && renderSummaryAndTerms()}
            </main>

            <footer className="w-full mt-auto p-2 border-t-2 border-black text-center text-xs">
              {resolvedSettings?.footerText && <p className="whitespace-pre-wrap">{resolvedSettings.footerText}</p>}
               <div className="mt-1">
                  صفحة {pageIndex + 1} من {totalPages}
              </div>
            </footer>
          </div>
        );
      })}
    </>
  );
}
