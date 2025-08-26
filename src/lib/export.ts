
"use client";

import type { DocumentData, DocumentItem } from "./types";
import { formatCurrency } from "./utils";


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
 * Builds a self-contained HTML string for a document, suitable for PDF/Word export,
 * by cloning the preview element and adding necessary styles.
 * @param previewElement The live preview DOM element.
 * @returns A full HTML string ready for export.
 */
function buildExportHtml(previewElement: HTMLElement): string {
    const clone = previewElement.cloneNode(true) as HTMLElement;

    // Ensure all dynamic content is fully rendered in the clone if needed (usually it is)
    // For this app, the preview is self-contained, so a direct clone is sufficient.

    const htmlContent = clone.outerHTML;

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
          <style>
            /* Reset and base styles for export */
            body { 
              font-family: 'PT Sans', 'Arial', sans-serif; 
              direction: rtl; 
              line-height: 1.4; 
              color: #000;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #fff; /* Ensure background is white */
            }
            /* Page setup for A4 */
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 20mm 15mm; /* top, right, bottom, left */
            }

            /* Main container for Word compatibility */
            .word-body {
              width: 210mm;
              height: 297mm;
            }
             div.WordSection1 {
                page: WordSection1;
            }

            /* Ensure the preview container itself doesn't have conflicting styles */
            #document-preview {
              box-shadow: none !important;
              border: none !important;
              background-color: #fff !important;
              color: #000 !important;
              padding: 0 !important;
              font-size: 10pt;
            }
            #document-preview header, 
            #document-preview footer {
               position: static !important; /* Override sticky/fixed positioning for export */
            }

            /* Table styles */
            table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: auto;
            }
            
            thead {
                display: table-header-group; /* Crucial for repeating headers */
            }

            tbody {
                display: table-row-group;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            td, th {
              page-break-inside: avoid;
              border: 1px solid #ccc; /* Use a lighter border for a cleaner look */
              padding: 5px;
            }
            th {
                background-color: #f2f2f2 !important; /* Ensure header bg prints */
                font-weight: bold;
            }
             .document-preview-table .bg-gray-100 {
                background-color: #f2f2f2 !important;
             }
             .whitespace-pre-wrap {
                white-space: pre-wrap !important;
             }

            /* Footer specific styles */
            footer {
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
            .no-print {
              display: none !important;
            }
             .summary-section {
                page-break-before: auto;
                page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
            <div class="WordSection1 word-body">
              ${htmlContent}
            </div>
        </body>
      </html>
    `;
}

export async function exportToPdf(fileName: string) {
    const previewElement = document.getElementById('document-preview');
    if (!previewElement) {
        throw new Error("Preview element not found.");
    }
    const html2pdf = (await import('html2pdf.js')).default;
    const htmlContent = buildExportHtml(previewElement);

    const opt = {
        margin: 0, // Margins are handled by the @page CSS rule
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: -window.scrollY },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    // The worker handles the entire conversion process
    await html2pdf().from(htmlContent).set(opt).save();
}


export async function exportToWord(fileName:string) {
    const previewElement = document.getElementById('document-preview');
    if (!previewElement) {
        throw new Error("Preview element not found.");
    }
    const sourceHTML = buildExportHtml(previewElement);

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
            <w:WordDrawingGridHorizontalSpacing>0</w:WordDrawingGridHorizontalSpacing>
            <w:WordDrawingGridVerticalSpacing>0</w:WordDrawingGridVerticalSpacing>
          </w:WordDocument>
          <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="true"
            DefSemiHidden="true" DefQFormat="false" DefPriority="99"
            LatentStyleCount="267">
          </w:LatentStyles>
        </xml>
        <![endif]-->
        <style>
          ${sourceHTML.match(/<style>([\s\S]*)<\/style>/i)?.[1] || ''}
        </style>
      </head>
      <body lang=AR-SA>
        <div class="WordSection1 word-body">
            ${sourceHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || ''}
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
