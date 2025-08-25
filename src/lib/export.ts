
"use client";

import type { DocumentData, DocumentItem, SettingsData } from "./types";
import { getSettings } from "./firebase-client";
import { formatCurrency } from "./utils";


/**
 * Converts an image URL to a Base64 string.
 * @param url The URL of the image.
 * @returns A promise that resolves with the Base64 string.
 */
async function imageToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
           // Try with a CORS proxy as a fallback
           const proxyResponse = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
            if (!proxyResponse.ok) {
                 throw new Error(`Failed to fetch image directly and via proxy: ${proxyResponse.statusText}`);
            }
           const blob = await proxyResponse.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to convert image to Base64:", e);
        // Fallback transparent pixel
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }
}


/**
 * Converts an array of items to a CSV string.
 */
function convertToCSV(items: DocumentItem[]): string {
  const headers = ["البيان", "الوحدة", "الكمية", "السعر", "الإجمالي"];
  const rows = items.map(item => {
    const total = (item.quantity || 0) * (item.price || 0);
    const description = `"${(item.description || '').replace(/"/g, '""')}"`;
    return [description, item.unit, item.quantity, item.price, total].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Builds a self-contained HTML string for a document, suitable for PDF/Word export.
 * @param docData The document data.
 * @param settings The application settings.
 * @returns A promise resolving to the full HTML string.
 */
async function buildExportHtml(docData: DocumentData, settings: SettingsData): Promise<string> {
    const headerImageBase64 = settings.headerImageUrl ? await imageToBase64(settings.headerImageUrl) : '';

    const today = new Date(docData.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const docTypeName = docData.docType === 'quote' ? 'عرض سعر' : 'مقايسة';
    const docIdText = docData.docId || '[سيتم إنشاؤه عند الحفظ]';

    const itemsHtml = docData.items.map((item, index) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; vertical-align: top; width: 5%;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 6px; white-space: pre-wrap; vertical-align: top; text-align: right;">${item.description || ''}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; vertical-align: top; width: 10%;">${item.unit}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; vertical-align: top; width: 10%;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; vertical-align: top; width: 15%;">${formatCurrency(item.price || 0)}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; vertical-align: top; width: 15%;">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
        </tr>
    `).join('');

    const summaryHtml = `
      <div class="summary-section" style="display: flex; justify-content: space-between; align-items: flex-start; padding-top: 15px; page-break-inside: avoid;">
          <div style="flex-grow: 1; padding-left: 20px;">
              ${docData.docType === 'quote' ? `
                  <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt;">طريقة الدفع:</h3>
                  <div style="white-space: pre-wrap; font-size: 10pt; margin-bottom: 15px;">${docData.paymentMethod || ''}</div>
                  <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt;">الشروط العامة:</h3>
                  <div style="white-space: pre-wrap; font-size: 10pt;">${docData.terms || ''}</div>
              ` : ''}
          </div>
          <div style="width: 40%; min-width: 280px; flex-shrink: 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                  <tbody>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">المجموع قبل الضريبة</td>
                          <td style="border: 1px solid #ddd; padding: 6px; text-align: left;">${formatCurrency(docData.subTotal)}</td>
                      </tr>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">الضريبة (14%)</td>
                          <td style="border: 1px solid #ddd; padding: 6px; text-align: left;">${formatCurrency(docData.taxAmount)}</td>
                      </tr>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #eee;">الإجمالي</td>
                          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #eee; text-align: left;">${formatCurrency(docData.total)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    `;

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
          <style>
            body { font-family: 'PT Sans', sans-serif; direction: rtl; font-size: 10pt; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="export-container">
            <header class="export-header">
                ${headerImageBase64 ? `<img src="${headerImageBase64}" style="width: 100%; height: auto; max-height: 120px; object-fit: contain; margin-bottom: 10px;">` : ''}
                 <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11pt; padding: 0 5px;">
                    <span style="text-align: left;">التاريخ: ${today}</span>
                    <span style="text-align: right;">${docTypeName} رقم: ${docIdText}</span>
                </div>
                 <div style="text-align: right; padding: 0 5px; margin-bottom: 15px;">
                    <p style="margin: 2px 0;"><span style="font-weight: bold;">السادة/</span> ${docData.clientName || ''}</p>
                    <p style="margin: 2px 0;"><span style="font-weight: bold;">الموضوع/</span> ${docData.subject || ''}</p>
                </div>
                <div style="text-align: right; padding: 0 5px; margin-bottom: 10px;">
                  <p style="margin:0;">تحية طيبة وبعد،،</p>
                  <p style="margin:0;">بالإشارة إلى الموضوع أعلاه نتشرف بتقديم عرض أسعارنا كما يلي:</p>
                </div>
            </header>

            <main class="export-content">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #36454F; color: white;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">م</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">البيان</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الوحدة</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">العدد</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">السعر</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        <tr><td colspan="6" style="padding:0;">${summaryHtml}</td></tr>
                    </tbody>
                </table>
            </main>

            <footer class="export-footer">
                ${settings.footerText.replace(/\n/g, '<br />')}
            </footer>
          </div>
        </body>
      </html>
    `;
}

export async function exportToPdf(docData: DocumentData, fileName: string) {
    const html2pdf = (await import('html2pdf.js')).default;
    const settings = await getSettings();
    const htmlContent = await buildExportHtml(docData, settings);

    const opt = {
        margin: [20, 15, 30, 15], // top, right, bottom, left in mm
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    const worker = html2pdf().from(htmlContent).set(opt);
    await worker.save();
}


export async function exportToWord(docData: DocumentData, fileName: string) {
    const settings = await getSettings();
    const sourceHTML = await buildExportHtml(docData, settings);
    
    const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportToExcel(items: DocumentItem[], fileName: string) {
    const csvContent = convertToCSV(items);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
