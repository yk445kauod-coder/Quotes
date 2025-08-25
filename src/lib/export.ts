
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
        // Use a CORS proxy if needed, but try direct fetch first
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
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
    // Ensure description with commas is wrapped in quotes
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

    const today = new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const docTypeName = docData.docType === 'quote' ? 'عرض سعر' : 'مقايسة';
    const docIdText = docData.docId || '[سيتم إنشاؤه عند الحفظ]';

    const ITEMS_PER_PAGE = 14;
    const itemChunks: DocumentItem[][] = [];
    for (let i = 0; i < docData.items.length; i += ITEMS_PER_PAGE) {
        itemChunks.push(docData.items.slice(i, i + ITEMS_PER_PAGE));
    }
    
    if (itemChunks.length === 0) {
      itemChunks.push([]); // Ensure at least one page for empty documents
    }

    let pagesHtml = '';

    for (let pageIndex = 0; pageIndex < itemChunks.length; pageIndex++) {
        const chunk = itemChunks[pageIndex];
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === itemChunks.length - 1;
        
        const itemsHtml = chunk.map((item, index) => `
            <tr>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: center; vertical-align: top;">${pageIndex * ITEMS_PER_PAGE + index + 1}</td>
                <td style="border: 1px solid #ccc; padding: 5px; white-space: pre-wrap; vertical-align: top;">${item.description || ''}</td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: center; vertical-align: top;">${item.unit}</td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: center; vertical-align: top;">${item.quantity}</td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: right; vertical-align: top;">${formatCurrency(item.price || 0)}</td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: right; vertical-align: top;">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
            </tr>
        `).join('');

        pagesHtml += `
            <div class="pdf-page-container" style="display: flex; flex-direction: column; min-height: 257mm;">
                ${isFirstPage ? `
                    <header class="pdf-header">
                        ${headerImageBase64 ? `<img src="${headerImageBase64}" style="width: 100%; height: auto; max-height: 110px; object-fit: contain;">` : ''}
                    </header>
                    <div style="text-align: center; margin: 10px 0;">
                        <h2 style="font-weight: bold; text-decoration: underline;">${docTypeName}</h2>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>التاريخ: ${today}</span>
                        <span>${docTypeName} رقم: ${docIdText}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <p><span style="font-weight: bold;">السادة/</span> ${docData.clientName || ''}</p>
                        <p><span style="font-weight: bold;">الموضوع:</span> ${docData.subject || ''}</p>
                    </div>
                ` : ''}
                
                <main style="flex-grow: 1;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 5%;">م</th>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 45%;">البيان</th>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 10%;">الوحدة</th>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 10%;">الكمية</th>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 15%;">السعر</th>
                                <th style="border: 1px solid #ccc; padding: 5px; background-color: #f2f2f2; width: 15%;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </main>

                ${isLastPage ? `
                    <div class="summary-section" style="padding-top: 10px; margin-top: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                           <div style="flex-grow: 1; padding-right: 20px;">
                                ${docData.docType === 'quote' ? `
                                    <h3 style="font-weight: bold; margin-bottom: 5px; font-size: 10pt;">الشروط:</h3>
                                    <div style="white-space: pre-wrap; font-size: 10pt;">${docData.terms || ''}</div>
                                    <h3 style="font-weight: bold; margin-top: 15px; margin-bottom: 5px; font-size: 10pt;">طريقة الدفع:</h3>
                                    <div style="white-space: pre-wrap; font-size: 10pt;">${docData.paymentMethod || ''}</div>
                                ` : ''}
                           </div>
                           <div style="width: 35%; min-width: 250px;">
                               <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                                  <tbody>
                                      <tr>
                                          <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold;">المجموع</td>
                                          <td style="border: 1px solid #ccc; padding: 5px; text-align: right;">${formatCurrency(docData.subTotal)}</td>
                                      </tr>
                                      <tr>
                                          <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold;">الضريبة (14%)</td>
                                          <td style="border: 1px solid #ccc; padding: 5px; text-align: right;">${formatCurrency(docData.taxAmount)}</td>
                                      </tr>
                                      <tr>
                                          <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold; background-color: #f2f2f2;">الإجمالي الكلي</td>
                                          <td style="border: 1px solid #ccc; padding: 5px; font-weight: bold; background-color: #f2f2f2; text-align: right;">${formatCurrency(docData.total)}</td>
                                      </tr>
                                  </tbody>
                              </table>
                           </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'PT Sans', sans-serif; direction: rtl; font-size: 10pt; line-height: 1.4; }
            @page { 
              size: A4 portrait; 
              margin: 20mm;
            }
            .pdf-page-container { page-break-after: always; }
            .pdf-page-container:last-child { page-break-after: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            .pdf-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 9pt;
              width: 100%;
              padding: 8px 0;
              border-top: 2px solid black;
              background-color: white;
            }
          </style>
        </head>
        <body>
          <footer class="pdf-footer">
              ${settings.footerText.replace(/\n/g, '<br />')}
          </footer>
          ${pagesHtml}
          <div style="height: 100px;"></div> <!-- Footer placeholder for print -->
        </body>
      </html>
    `;
}

export async function exportToPdf(docData: DocumentData, fileName: string) {
    const html2pdf = (await import('html2pdf.js')).default;
    const settings = await getSettings();
    const htmlContent = await buildExportHtml(docData, settings);

    const opt = {
        margin: [20, 20, 25, 20], // top, left, bottom, right in mm
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    return html2pdf().from(htmlContent).set(opt).save();
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
    // Add BOM for UTF-8 support in Excel
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
