
"use client";

import type { DocumentItem } from "./types";

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
 * Exports a given HTML element to a PDF file.
 * @param element The HTML element to export.
 * @param fileName The desired name of the output file.
 */
export async function exportToPdf(element: HTMLElement, fileName: string) {
    if (!element) {
        throw new Error("Element to export not found.");
    }
    const html2pdf = (await import('html2pdf.js')).default;

    // The options are critical for getting the output right.
    const opt = {
        margin: 0, // We control margins with CSS on the .a4-page
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, // Higher scale for better quality
            useCORS: true, 
            logging: false,
            // These are important to ensure the full content is captured
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // Let our CSS control the page breaks
        pagebreak: { mode: ['css', 'legacy'] } 
    };
    
    // html2pdf can work directly with the element.
    await html2pdf().from(element).set(opt).save();
}


/**
 * Exports a given HTML element to a Word (.doc) file by wrapping it in the necessary HTML structure.
 * @param element The HTML element to export.
 * @param fileName The desired name of the output file.
 */
export async function exportToWord(element: HTMLElement, fileName: string) {
    if (!element) {
        throw new Error("Element to export not found.");
    }
    
    // Get the element's static HTML content
    const staticHtml = element.innerHTML;

    // Consolidate all styles from the document's stylesheets
    const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
            try {
                // Join all rules from a single stylesheet
                return Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
            } catch (e) {
                // Ignore stylesheets that can't be accessed (e.g., cross-origin)
                console.warn("Could not read stylesheet for export:", e);
                return '';
            }
        })
        .join('\n');

    // Create the full HTML structure for the Word document
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
            <w:RtlGutter/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            /* All the CSS from the document is injected here */
            ${styles}
        </style>
      </head>
      <body lang="AR-SA" dir="RTL">
        <div class="WordSection1">
            ${staticHtml}
        </div>
      </body>
      </html>`;

    // Create a Blob and trigger the download
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


/**
 * Exports an array of items to a CSV file.
 * @param items The items to export.
 * @param fileName The desired name of the output file.
 */
export function exportToExcel(items: DocumentItem[], fileName: string) {
    const csvContent = convertToCSV(items);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // BOM for UTF-8 Excel compatibility
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
