
"use client";

import type { DocumentData, DocumentItem, SettingsData } from "./types";
import { getSettings } from "./firebase-client";
import { formatCurrency } from "./utils";


/**
 * Converts an image URL to a Base64 string.
 * Uses a proxy to avoid CORS issues.
 * @param url The URL of the image.
 * @returns A promise that resolves with the Base64 string.
 */
async function imageToBase64(url: string): Promise<string> {
    // A simple CORS proxy can be used, or a serverless function.
    // This example uses a public proxy for demonstration.
    // For production, it's highly recommended to host your own proxy.
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    try {
        const response = await fetch(`${proxyUrl}${url}`);
        if (!response.ok) {
            console.error(`CORS Anywhere proxy failed: ${response.statusText}. Trying direct fetch.`);
            // Fallback to direct fetch if proxy fails
            const directResponse = await fetch(url);
            if (!directResponse.ok) {
                throw new Error(`Direct fetch failed: ${directResponse.statusText}`);
            }
            const blob = await directResponse.blob();
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
        // Fallback transparent pixel if all methods fail
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
 * This function has been completely rebuilt to match the target design image.
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
        <tr style="page-break-inside: avoid;">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top; width: 5%;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; white-space: pre-wrap; vertical-align: top; text-align: right; line-height: 1.5; width: 50%;">${item.description || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top; width: 10%;">${item.unit}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top; width: 10%;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top; width: 12.5%;">${formatCurrency(item.price || 0)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top; width: 12.5%;">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
        </tr>
    `).join('');

    const summaryHtml = `
      <table style="width: 100%; margin-top: 20px; page-break-inside: avoid;">
        <tr>
          <td style="width: 60%; vertical-align: top; padding-left: 20px;">
              ${docData.docType === 'quote' ? `
                  <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt; text-align: right;">طريقة الدفع:</h3>
                  <div style="white-space: pre-wrap; font-size: 10pt; text-align: right; margin-bottom: 15px; line-height: 1.6;">${docData.paymentMethod || ''}</div>
                  <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt; text-align: right;">الشروط العامة:</h3>
                  <div style="white-space: pre-wrap; font-size: 10pt; text-align: right; line-height: 1.6;">${docData.terms || ''}</div>
              ` : ''}
          </td>
          <td style="width: 40%; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                  <tbody>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: right;">المجموع قبل الضريبة</td>
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(docData.subTotal)}</td>
                      </tr>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: right;">الضريبة (14%)</td>
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(docData.taxAmount)}</td>
                      </tr>
                      <tr>
                          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #eee; text-align: right;">الإجمالي</td>
                          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #eee; text-align: right;">${formatCurrency(docData.total)}</td>
                      </tr>
                  </tbody>
              </table>
          </td>
        </tr>
      </table>
    `;

    const footerTextHorizontal = settings.footerText.replace(/\n/g, '  <span style="margin: 0 10px;">/</span>  ');

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'PT Sans', 'Arial', sans-serif; 
              direction: rtl; 
              font-size: 10pt; 
              line-height: 1.4; 
              color: #000;
              margin: 0;
            }
            .page-content {
              padding-bottom: 40mm; /* Space for the footer */
            }
            .export-footer {
                display: none; /* Hide in body, only visible in @page */
            }
          </style>
        </head>
        <body>
          <div class="page-content">
            <header class="export-header" style="width: 100%; margin-bottom: 10px;">
                ${headerImageBase64 ? `<img src="${headerImageBase64}" style="width: 100%; height: auto; display: block; max-height: 150px; object-fit: contain;">` : ''}
            </header>
            
            <table style="width: 100%; margin-bottom: 15px; font-size: 11pt;">
              <tr>
                <td style="text-align: right;"><strong>السادة/</strong> ${docData.clientName || ''}</td>
                <td style="text-align: left;"><strong>التاريخ:</strong> ${today}</td>
              </tr>
              <tr>
                <td style="text-align: right;"><strong>الموضوع/</strong> ${docData.subject || ''}</td>
                <td style="text-align: left;"><strong>${docTypeName} رقم:</strong> ${docIdText}</td>
              </tr>
            </table>

            <div style="text-align: right; margin-bottom: 15px; font-size: 11pt;">
              <p style="margin:0;">تحية طيبة وبعد،،</p>
              <p style="margin:0;">بالإشارة إلى الموضوع أعلاه نتشرف بتقديم عرض أسعارنا كما يلي:</p>
            </div>

            <main>
                <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                    <thead style="background-color: #36454F; color: white;">
                        <tr>
                            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 5%;">م</th>
                            <th style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; width: 50%;">البيان</th>
                            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 10%;">الوحدة</th>
                            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 10%;">العدد</th>
                            <th style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; width: 12.5%;">السعر</th>
                            <th style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; width: 12.5%;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                ${summaryHtml}
            </main>
          </div>
            <footer class="export-footer">
                ${footerTextHorizontal}
            </footer>
        </body>
      </html>
    `;
}

export async function exportToPdf(docData: DocumentData, fileName: string) {
    const html2pdf = (await import('html2pdf.js')).default;
    const settings = await getSettings();
    const htmlContent = await buildExportHtml(docData, settings);

    const opt = {
        margin: 15, // in mm
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    // The worker handles the entire conversion process
    await html2pdf().from(htmlContent).set(opt).save();
}


export async function exportToWord(docData: DocumentData, fileName:string) {
    const settings = await getSettings();
    const sourceHTML = await buildExportHtml(docData, settings);
    
    // Adding Word-specific XML and header to ensure proper RTL display and structure
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
            <w:RtlGutter/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            mso-page-orientation: portrait;
            margin: 1.5cm;
          }
          body {
            font-family: Arial, sans-serif;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td, th {
            border: 1px solid black;
            padding: 8px;
          }
        </style>
      </head>
      <body>
        ${sourceHTML}
      </body>
      </html>`;

    const blob = new Blob(['\ufeff', wordHtml], {
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
