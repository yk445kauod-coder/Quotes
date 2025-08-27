
"use client";

import { formatCurrency, formatNumberToHindi, formatTextWithHindiNumerals } from "@/lib/utils";
import Image from "next/image";
import type { DocumentData, SettingsData, DocumentItem } from "@/lib/types";
import React, { useState, useEffect } from "react";
import { getSettings as getClientSettings } from "@/lib/firebase-client";
import { Skeleton } from "./ui/skeleton";
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';


interface ColumnVisibility {
  showIndexColumn: boolean;
  showUnitColumn: boolean;
  showQuantityColumn: boolean;
  showPriceColumn: boolean;
  showTotalColumn: boolean;
}

interface DocumentPreviewProps {
  formData: Partial<DocumentData>;
  settings?: SettingsData | null;
  columnVisibility?: ColumnVisibility;
}

const ResizableHeader = ({ onResize, width, children }: { onResize: (e: any, data: any) => void, width: number, children: React.ReactNode }) => {
    return (
        <Resizable
            width={width}
            height={0}
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th className="border p-1 cell-center" style={{ width: `${width}px` }}>{children}</th>
        </Resizable>
    );
};


export function DocumentPreview({ formData, settings: propSettings, columnVisibility: propColumnVisibility }: DocumentPreviewProps) {
  const [settings, setSettings] = useState<SettingsData | null | undefined>(propSettings);
  const [loading, setLoading] = useState(true);

  const columnVisibility = propColumnVisibility || {
      showIndexColumn: true,
      showUnitColumn: true,
      showQuantityColumn: true,
      showPriceColumn: true,
      showTotalColumn: true,
  };
  
  const initialWidths = {
    index: 50,
    description: 350,
    unit: 80,
    quantity: 80,
    price: 100,
    total: 120,
  };
  
  const [columnWidths, setColumnWidths] = useState(initialWidths);

  const handleResize = (key: keyof typeof initialWidths) => (e: any, { size }: any) => {
      setColumnWidths(prev => ({
          ...prev,
          [key]: size.width,
      }));
  };

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
  const date = new Date();
  const year = date.getFullYear();
  const today = `${formatNumberToHindi(date.getDate())} / ${formatNumberToHindi(date.getMonth() + 1)} / ${formatNumberToHindi(year)}`;
  const docIdText = docId ? formatTextWithHindiNumerals(docId) : '[سيتم إنشاؤه عند الحفظ]';

  // Smart Paging Logic:
  const itemChunks: DocumentItem[][] = [];
  if (items && items.length > 0) {
      let currentIndex = 0;
      while (currentIndex < items.length) {
          const chunk = items.slice(currentIndex, currentIndex + resolvedSettings.itemsPerPage);
          itemChunks.push(chunk);
          currentIndex += chunk.length;
      }
  } else {
      // Ensure there is at least one page even if there are no items
      itemChunks.push([]);
  }

  const totalPages = itemChunks.length;

  const renderTable = (chunk: DocumentItem[], startIndex: number) => (
      <table className="w-full border-collapse text-right mt-4" style={{ tableLayout: 'fixed' }}>
          <thead>
              <tr className="bg-gray-100">
                  {columnVisibility.showIndexColumn && <ResizableHeader width={columnWidths.index} onResize={handleResize('index')}>م</ResizableHeader>}
                  <ResizableHeader width={columnWidths.description} onResize={handleResize('description')}>البيان</ResizableHeader>
                  {columnVisibility.showUnitColumn && <ResizableHeader width={columnWidths.unit} onResize={handleResize('unit')}>الوحدة</ResizableHeader>}
                  {columnVisibility.showQuantityColumn && <ResizableHeader width={columnWidths.quantity} onResize={handleResize('quantity')}>{docType === 'quote' ? 'العدد' : 'الكمية'}</ResizableHeader>}
                  {columnVisibility.showPriceColumn && <ResizableHeader width={columnWidths.price} onResize={handleResize('price')}>السعر</ResizableHeader>}
                  {columnVisibility.showTotalColumn && <ResizableHeader width={columnWidths.total} onResize={handleResize('total')}>الإجمالي</ResizableHeader>}
              </tr>
          </thead>
          <tbody>
              {chunk.map((item, index) => (
                  <tr key={startIndex + index}>
                      {columnVisibility.showIndexColumn && <td className="border p-1 cell-center" style={{ width: `${columnWidths.index}px` }}>{formatNumberToHindi(startIndex + index + 1)}</td>}
                      <td className="border p-1 cell-top-right whitespace-pre-wrap" style={{ width: `${columnWidths.description}px` }}>{formatTextWithHindiNumerals(item.description || '')}</td>
                      {columnVisibility.showUnitColumn && <td className="border p-1 cell-center" style={{ width: `${columnWidths.unit}px` }}>{item.unit}</td>}
                      {columnVisibility.showQuantityColumn && <td className="border p-1 cell-center" style={{ width: `${columnWidths.quantity}px` }}>{formatNumberToHindi(item.quantity || 0)}</td>}
                      {columnVisibility.showPriceColumn && <td className="border p-1 cell-center" style={{ width: `${columnWidths.price}px` }}>{formatCurrency(item.price || 0)}</td>}
                      {columnVisibility.showTotalColumn && <td className="border p-1 cell-center" style={{ width: `${columnWidths.total}px` }}>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>}
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
                      <div className="whitespace-pre-wrap">{terms ? formatTextWithHindiNumerals(terms) : ''}</div>
                      <h3 className="font-bold text-sm mt-2 mb-1">طريقة الدفع:</h3>
                      <div className="whitespace-pre-wrap">{paymentMethod ? formatTextWithHindiNumerals(paymentMethod) : ''}</div>
                  </>
              )}
          </div>
          <div className="w-2/5 max-w-[280px]">
              <table className="w-full border-collapse text-right">
                  <tbody>
                      <tr>
                          <td className="border p-1 font-bold cell-center">{formatTextWithHindiNumerals('المجموع')}</td>
                          <td className="border p-1 cell-center">{formatCurrency(subTotal)}</td>
                      </tr>
                      <tr>
                          <td className="border p-1 font-bold cell-center">
                            <span>{formatTextWithHindiNumerals('الضريبة')}</span>
                            &nbsp;
                            <span dir="ltr">14%</span>
                          </td>
                          <td className="border p-1 cell-center">{formatCurrency(taxAmount)}</td>
                      </tr>
                      <tr>
                          <td className="border p-1 font-bold bg-gray-100 cell-center">{formatTextWithHindiNumerals('الإجمالي الكلي')}</td>
                          <td className="border p-1 font-bold bg-gray-100 cell-center">{formatCurrency(total)}</td>
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
                          <p><span className="font-bold">السادة/</span> <span className="whitespace-pre-wrap">{clientName}</span></p>
                          <p><span className="font-bold">الموضوع:</span> <span>{subject}</span></p>
                      </div>
                  </>
               )}
            </header>

            <main>
              {renderTable(chunk, startIndex)}
              {isLastPage && renderSummaryAndTerms()}
            </main>

            <footer className="w-full mt-auto p-2 text-center text-xs">
              {resolvedSettings?.footerText && <p className="whitespace-pre-wrap">{formatTextWithHindiNumerals(resolvedSettings.footerText)}</p>}
               <div className="mt-1">
                  صفحة {formatNumberToHindi(pageIndex + 1)} من {formatNumberToHindi(totalPages)}
              </div>
            </footer>
          </div>
        );
      })}
    </>
  );
}
