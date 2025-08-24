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
}

const headerImageUrl = "https://ik.imagekit.io/fpbwa3np7/%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%A7%D8%B3%D8%B9%D8%A7%D8%B1/header%20-%20Copy.png?updatedAt=1755348570527";
const footerText = "المصرية للمقاولات الكهروميكانيكية\nالبحيرة، كفر الدوار، طريق اسكندرية القاهرة الزراعي، كيلو 35\n0452139565 / 01117744552 / 01044760706";

export function DocumentPreview({ formData }: DocumentPreviewProps) {
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

  return (
    <div id="document-preview" className="bg-white text-black p-8 font-body text-sm h-full overflow-auto">
      <div className="flex flex-col h-full">
        <header className="w-full mb-8">
            <Image
                src={headerImageUrl}
                alt="Company Header"
                width={700}
                height={150}
                className="w-full h-auto object-contain"
                data-ai-hint="company logo"
            />
        </header>
        
        <div className="text-center my-4">
            <h2 className="text-2xl font-bold underline">{docTypeName}</h2>
        </div>

        <div className="flex justify-between mb-4 text-base">
            <span>التاريخ: {today}</span>
            <span>{docTypeName} رقم: [سيتم إنشاؤه عند الحفظ]</span>
        </div>
        
        <div className="mb-4 text-base">
            <p><span className="font-bold">السادة/الشركة:</span> {clientName}</p>
            <p><span className="font-bold">الموضوع:</span> {subject}</p>
        </div>

        <table className="w-full border-collapse text-right document-preview-table mb-4">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border p-2 w-[5%]">م</th>
                    <th className="border p-2 w-2/5">{docType === 'quote' ? 'البيان' : 'البند'}</th>
                    <th className="border p-2">الوحدة</th>
                    <th className="border p-2">{docType === 'quote' ? 'العدد' : 'الكمية'}</th>
                    <th className="border p-2">السعر</th>
                    <th className="border p-2">الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">{item.description}</td>
                        <td className="border p-2">{item.unit}</td>
                        <td className="border p-2">{item.quantity}</td>
                        <td className="border p-2">{formatCurrency(item.price || 0)}</td>
                        <td className="border p-2">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="flex justify-end mb-4">
            <div className="w-2/5">
                <table className="w-full border-collapse text-right document-preview-table">
                    <tbody>
                        <tr>
                            <td className="border p-2 font-bold">المجموع</td>
                            <td className="border p-2">{formatCurrency(subTotal)}</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold">الضريبة (14%)</td>
                            <td className="border p-2">{formatCurrency(taxAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold bg-gray-100">الإجمالي الكلي</td>
                            <td className="border p-2 font-bold bg-gray-100">{formatCurrency(total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="mt-auto pt-8">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-base mb-2">{docType === 'quote' ? 'الشروط:' : 'ملاحظات:'}</h3>
                    <p className="whitespace-pre-wrap">{terms}</p>
                </div>
                <div>
                    <h3 className="font-bold text-base mb-2">طريقة الدفع:</h3>
                    <p className="whitespace-pre-wrap">{paymentMethod}</p>
                </div>
            </div>
        
            <footer className="w-full mt-8 pt-4 border-t-2 border-black text-center text-xs">
                <p className="whitespace-pre-wrap">{footerText}</p>
            </footer>
        </div>
      </div>
    </div>
  );
}
