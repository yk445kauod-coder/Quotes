
"use client";

import type { DocumentItem } from "./types";
import { getSettings } from "./firebase-client";

/**
 * Converts an image URL to a Base64 string by fetching it through a CORS proxy if needed.
 * @param url The URL of the image.
 * @returns A promise that resolves with the Base64 string.
 */
async function imageToBase64(url: string): Promise<string> {
    try {
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
        // Fallback or error placeholder can be returned
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

export async function exportToPdf(element: HTMLElement, fileName: string) {
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 0,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    return html2pdf().from(element).set(opt).save();
}

export async function exportToWord(element: HTMLElement, fileName: string) {
    const settings = await getSettings();
    const headerImageBase64 = settings.headerImageUrl ? await imageToBase64(settings.headerImageUrl) : '';

    // Clone the element to avoid modifying the original DOM
    const clonedElement = element.cloneNode(true) as HTMLElement;
    const imgElement = clonedElement.querySelector('img');
    if (imgElement && headerImageBase64) {
        imgElement.src = headerImageBase64;
        imgElement.style.width = '100%';
        imgElement.style.height = 'auto';
        imgElement.style.objectFit = 'contain';
    }

    let sourceHTML = clonedElement.innerHTML;

    // Use a more robust way to define styles for Word
    const styles = `
        <style>
            @page WordSection1 {
                size: 8.5in 11.0in;
                margin: 1.0in 1.0in 1.0in 1.0in;
                mso-header-margin: .5in;
                mso-footer-margin: .5in;
                mso-paper-source: 0;
            }
            div.WordSection1 { page: WordSection1; }
            body { font-family: 'PT Sans', Arial, sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            th, td { border: 1px solid black; padding: 5px; text-align: right; vertical-align: top; }
            p { margin: 0; padding: 0; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
        </style>
    `;

    const headerContent = `
        <div style='mso-element:header' id=h1>
            <p class=MsoHeader>${clonedElement.querySelector('header')?.innerHTML || ''}</p>
        </div>
    `;
    
    const footerContent = `
        <div style='mso-element:footer' id=f1>
             <p class=MsoFooter>${clonedElement.querySelector('footer')?.innerHTML || ''}</p>
        </div>
    `;

    const mainContent = clonedElement.querySelector('main')?.innerHTML || '';

    const finalHTML = `
      <html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
          <meta charset='utf-8'>
          <title>Export HTML to Word Document</title>
          ${styles}
      </head>
      <body>
          <div class="WordSection1">
              ${headerContent}
              ${mainContent}
              ${footerContent}
          </div>
      </body>
      </html>`;
    
    const blob = new Blob(['\ufeff', finalHTML], {
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
