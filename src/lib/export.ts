
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
    if (!url) return "";
    try {
        // Using a more reliable proxy
        const response = await fetch(`https://images.weserv.nl/?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Proxy fetch failed: ${response.statusText}`);
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
 * This function handles pagination correctly.
 * @param docData The document data.
 * @param settings The application settings.
 * @returns A promise resolving to the full HTML string.
 */
async function buildExportHtml(docData: DocumentData, settings: SettingsData): Promise<string> {
    const headerImageBase64 = settings.headerImageUrl ? await imageToBase64(settings.headerImageUrl) : '';

    const today = new Date(docData.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const docTypeName = docData.docType === 'quote' ? 'عرض سعر' : 'مقايسة';
    const docIdText = docData.docId || '[سيتم إنشاؤه عند الحفظ]';

    const ITEMS_PER_PAGE = 14;
    const itemPages = [];
    for (let i = 0; i < docData.items.length; i += ITEMS_PER_PAGE) {
        itemPages.push(docData.items.slice(i, i + ITEMS_PER_PAGE));
    }
    
    const totalPages = itemPages.length;

    const renderItemsTable = (items: DocumentItem[], startIndex: number) => {
        const rows = items.map((item, index) => `
            <tr style="page-break-inside: avoid;">
                <td style="border: 1px solid #333; padding: 6px; text-align: center; vertical-align: top; width: 5%;">${startIndex + index + 1}</td>
                <td style="border: 1px solid #333; padding: 6px; white-space: pre-wrap; vertical-align: top; text-align: right; line-height: 1.5; width: 50%;">${item.description || ''}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; vertical-align: top; width: 10%;">${item.unit}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; vertical-align: top; width: 10%;">${item.quantity}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: right; vertical-align: top; width: 12.5%;">${formatCurrency(item.price || 0)}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: right; vertical-align: top; width: 12.5%;">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
            </tr>
        `).join('');

        return `
            <table class="items-table" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
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
                    ${rows}
                </tbody>
            </table>
        `;
    };

    const summarySection = `
      <div class="summary-section">
        <table style="width: 100%; margin-top: 20px; border: none; page-break-inside: avoid;">
            <tr>
              <td style="width: 60%; vertical-align: top; padding-left: 20px; border: none;">
                  ${docData.docType === 'quote' ? `
                      <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt; text-align: right;">طريقة الدفع:</h3>
                      <div style="white-space: pre-wrap; font-size: 10pt; text-align: right; margin-bottom: 15px; line-height: 1.6;">${docData.paymentMethod || ''}</div>
                      <h3 style="font-weight: bold; margin: 0 0 5px 0; font-size: 11pt; text-align: right;">الشروط العامة:</h3>
                      <div style="white-space: pre-wrap; font-size: 10pt; text-align: right; line-height: 1.6;">${docData.terms || ''}</div>
                  ` : ''}
              </td>
              <td style="width: 40%; vertical-align: top; border: none;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                      <tbody>
                          <tr>
                              <td style="border: 1px solid #333; padding: 8px; font-weight: bold; text-align: right;">المجموع قبل الضريبة</td>
                              <td style="border: 1px solid #333; padding: 8px; text-align: right;">${formatCurrency(docData.subTotal)}</td>
                          </tr>
                          <tr>
                              <td style="border: 1px solid #333; padding: 8px; font-weight: bold; text-align: right;">الضريبة (14%)</td>
                              <td style="border: 1px solid #333; padding: 8px; text-align: right;">${formatCurrency(docData.taxAmount)}</td>
                          </tr>
                          <tr>
                              <td style="border: 1px solid #333; padding: 8px; font-weight: bold; background-color: #eee; text-align: right;">الإجمالي</td>
                              <td style="border: 1px solid #333; padding: 8px; font-weight: bold; background-color: #eee; text-align: right;">${formatCurrency(docData.total)}</td>
                          </tr>
                      </tbody>
                  </table>
              </td>
            </tr>
        </table>
      </div>
    `;

    let pagesHtml = '';
    itemPages.forEach((pageItems, pageIndex) => {
        pagesHtml += `<div class="page-container">`;
        // Page Header (only on first page)
        if (pageIndex === 0) {
            pagesHtml += `
                <header class="export-header">
                    ${headerImageBase64 ? `<img src="${headerImageBase64}" style="width: 100%; height: auto; display: block; max-height: 150px; object-fit: contain;">` : ''}
                </header>
                 <table style="width: 100%; margin-bottom: 15px; font-size: 11pt; border: none;">
                  <tr>
                    <td style="text-align: right; border: none;"><strong>السادة/</strong> ${docData.clientName || ''}</td>
                    <td style="text-align: left; border: none;"><strong>التاريخ:</strong> ${today}</td>
                  </tr>
                  <tr>
                    <td style="text-align: right; border: none;"><strong>الموضوع/</strong> ${docData.subject || ''}</td>
                    <td style="text-align: left; border: none;"><strong>${docTypeName} رقم:</strong> ${docIdText}</td>
                  </tr>
                </table>
                <div style="text-align: right; margin-bottom: 15px; font-size: 11pt;">
                  <p style="margin:0;">تحية طيبة وبعد،،</p>
                  <p style="margin:0;">بالإشارة إلى الموضوع أعلاه نتشرف بتقديم عرض أسعارنا كما يلي:</p>
                </div>
            `;
        }

        // Items Table
        pagesHtml += renderItemsTable(pageItems, pageIndex * ITEMS_PER_PAGE);
        
        pagesHtml += `</div>`; // end page-container
    });
    
    // Append the summary section AFTER the loop has finished, so it appears on the last page.
    pagesHtml += summarySection;


    const footerTextHorizontal = (settings.footerText || '').replace(/\n/g, '  <span style="margin: 0 10px;">/</span>  ');

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
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4;
              margin: 15mm 15mm 25mm 15mm; /* top, right, bottom, left */
            }
            .page-container {
                page-break-after: always;
            }
            .page-container:last-of-type {
                 page-break-after: avoid;
            }
            .export-header {
                width: 100%; 
                margin-bottom: 10px;
            }
            .items-table thead {
                display: table-header-group; /* Important for repeating headers */
                background-color: #36454F; 
                color: white;
            }
             .items-table tbody {
                display: table-row-group;
            }
            .export-footer {
                position: fixed;
                bottom: 0;
                left: 15mm;
                right: 15mm;
                width: calc(100% - 30mm);
                text-align: center;
                font-size: 9pt;
                padding-top: 5px;
                box-sizing: border-box;
                border-top: 2px solid black;
            }
            table {
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #333;
                text-align: right;
            }
            /* Word specific */
             .word-body {
              width: 210mm;
              height: 297mm;
            }
            div.WordSection1 {
                page: WordSection1;
            }
          </style>
        </head>
        <body>
            <div class="content-wrapper">
              ${pagesHtml}
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
        margin: 0, // Margins are handled by the @page CSS rule
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
          <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="true"
            DefSemiHidden="true" DefQFormat="false" DefPriority="99"
            LatentStyleCount="267">
            <w:LsdException Locked="false" Priority="0" SemiHidden="false"
            UnhideWhenUsed="false" QFormat="true" Name="Normal"/>
            <w:LsdException Locked="false" Priority="9" SemiHidden="false"
            UnhideWhenUsed="false" QFormat="true" Name="heading 1"/>
            <w:LsdException Locked="false" Priority="10" QFormat="true" Name="Title"/>
            <w:LsdException Locked="false" Priority="11" QFormat="true" Name="Subtitle"/>
          </w:LatentStyles>
        </xml>
        <![endif]-->
        <style>
            @page WordSection1 {
                size: 21cm 29.7cm; /* A4 */
                margin: 1.5cm;
                mso-header-margin: .5in;
                mso-footer-margin: .5in;
                mso-paper-source: 0;
            }
            body {
              font-family: 'PT Sans', Arial, sans-serif;
              direction: rtl;
            }
            div.WordSection1 {
                page: WordSection1;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                page-break-inside: auto;
            }
            tr { 
                page-break-inside: avoid; 
                page-break-after: auto 
            }
            thead { display: table-header-group; }
            td, th {
                border: 1px solid black;
                padding: 5px;
                text-align: right;
                page-break-inside: avoid;
            }
            .export-footer { display: none; }
        </style>
      </head>
      <body lang=AR-SA>
        <div class="WordSection1 word-body">
            ${sourceHTML}
        </div>
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
