"use client";

import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import type { DocumentType } from "@/lib/types";

interface DocumentPreviewProps {
  formData: {
    docType?: DocumentType;
    clientName?: string;
    subject?: string;
    items?: {
      description?: string;
      unit?: string;
      quantity?: number;
      price?: number;
    }[];
    terms?: string;
    paymentMethod?: string;
  };
  isForPdf?: boolean;
}

const headerImageUrl = "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527";
const footerText = "المصرية للمقاولات الكهروميكانيكية\nالبحيرة، كفر الدوار، طريق اسكندرية القاهرة الزراعي، كيلو 35\n0452139565 / 01117744552 / 01044760706";

export function DocumentPreview({ formData, isForPdf = false }: DocumentPreviewProps) {
  const {
    docType = "quote",
    clientName = "اسم الجهة",
    subject = "موضوع المستند",
    items = [],
    terms = "",
    paymentMethod = "",
  } = formData;

  const subTotal = items.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.price || 0),
    0
  );
  const taxAmount = subTotal * 0.14;
  const total = subTotal + taxAmount;
  const docTypeName = docType === 'quote' ? 'عرض سعر' : 'مقايسة';
  const today = new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  // Filter out empty items for PDF generation
  const validItems = items.filter(item => item.description && item.unit && item.quantity && item.price);
  const itemsToRender = isForPdf ? validItems : items;

  return (
    <div id="document-preview" className="bg-white text-black font-body text-sm h-full overflow-auto flex flex-col">
        <header className="w-full mb-4">
            <Image
                src={headerImageUrl}
                alt="Company Header"
                width={700}
                height={100}
                className="w-full h-auto object-contain"
                data-ai-hint="company logo"
                priority
            />
        </header>
        
        <main className="flex-grow px-8">
            <div className="text-center my-2">
                <h2 className="text-xl font-bold underline">{docTypeName}</h2>
            </div>

            <div className="flex justify-between mb-2 text-sm">
                <span>التاريخ: {today}</span>
                <span>{docTypeName} رقم: [سيتم إنشاؤه عند الحفظ]</span>
            </div>
            
            <div className="mb-2 text-sm">
                <p><span className="font-bold">السادة/الشركة:</span> {clientName}</p>
                <p><span className="font-bold">الموضوع:</span> {subject}</p>
            </div>

            <table className="w-full border-collapse text-right document-preview-table mb-2 text-xs">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-1 w-[4%]">م</th>
                        <th className="border p-1 w-[46%]">{docType === 'quote' ? 'البيان' : 'البند'}</th>
                        <th className="border p-1 w-[10%]">الوحدة</th>
                        <th className="border p-1 w-[10%]">{docType === 'quote' ? 'العدد' : 'الكمية'}</th>
                        <th className="border p-1 w-[15%]">السعر</th>
                        <th className="border p-1 w-[15%]">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsToRender.map((item, index) => (
                        <tr key={index}>
                            <td className="border p-1 align-top">{index + 1}</td>
                            <td className="border p-1 align-top whitespace-pre-wrap">{item.description}</td>
                            <td className="border p-1 align-top">{item.unit}</td>
                            <td className="border p-1 align-top">{item.quantity}</td>
                            <td className="border p-1 align-top">{formatCurrency(item.price || 0)}</td>
                            <td className="border p-1 align-top">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                        </tr>
                    ))}
                    {/* Add empty rows to fill the page for live preview only */}
                    {!isForPdf && Array.from({ length: Math.max(0, 15 - itemsToRender.length) }).map((_, i) => (
                         <tr key={`empty-${i}`}>
                            <td className="border p-1 h-8"></td>
                            <td className="border p-1"></td>
                            <td className="border p-1"></td>
                            <td className="border p-1"></td>
                            <td className="border p-1"></td>
                            <td className="border p-1"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="flex justify-between items-start">
                <div className="w-3/5 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-sm mb-1">{docType === 'quote' ? 'الشروط:' : 'ملاحظات:'}</h3>
                            <p className="whitespace-pre-wrap">{terms}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm mb-1">طريقة الدفع:</h3>
                            <p className="whitespace-pre-wrap">{paymentMethod}</p>
                        </div>
                    </div>
                </div>
                <div className="w-2/5 max-w-xs">
                    <table className="w-full border-collapse text-right document-preview-table text-xs">
                        <tbody>
                            <tr>
                                <td className="border p-1 font-bold">المجموع</td>
                                <td className="border p-1">{formatCurrency(subTotal)}</td>
                            </tr>
                            <tr>
                                <td className="border p-1 font-bold">الضريبة (14%)</td>
                                <td className="border p-1">{formatCurrency(taxAmount)}</td>
                            </tr>
                            <tr>
                                <td className="border p-1 font-bold bg-gray-100">الإجمالي الكلي</td>
                                <td className="border p-1 font-bold bg-gray-100">{formatCurrency(total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
        
        <footer className="w-full mt-auto p-4 pt-2 border-t-2 border-black text-center text-xs">
            <p className="whitespace-pre-wrap">{footerText}</p>
        </footer>
    </div>
  );
}
