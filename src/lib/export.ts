
"use client";
import type { DocumentItem } from "./types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
 * Exports a given HTML element to a Word (.doc) file by wrapping it in the necessary HTML structure.
 * @param element The HTML element to export.
 *param fileName The desired name of the output file.
 */
export async function exportToWord(element: HTMLElement, fileName:string) {
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
            @page {
                size: A4;
                margin: 10mm 15mm 15mm 15mm;
            }
            body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .a4-page {
                page-break-after: always;
            }
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


/**
 * Exports a given HTML element to a PDF file with high fidelity, handling multiple pages correctly.
 * @param element The container element holding all the .a4-page elements to capture.
 * @param fileName The name for the downloaded PDF file.
 */
export async function exportToPdf(element: HTMLElement, fileName: string) {
    if (!element) {
        throw new Error("Element to export not found.");
    }

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pages = element.querySelectorAll<HTMLElement>('.a4-page');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        const canvas = await html2canvas(page, {
            scale: 4, // High resolution capture
            useCORS: true,
            logging: false,
            allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98); // High quality JPEG
        
        // Calculate the aspect ratio to fit the image correctly onto the A4 page
        const imgProps = pdf.getImageProperties(imgData);
        const aspectRatio = imgProps.width / imgProps.height;
        
        let finalWidth = pdfWidth;
        let finalHeight = finalWidth / aspectRatio;

        // If the calculated height exceeds the page height, adjust based on height instead
        // This maintains the aspect ratio while ensuring the entire image fits.
        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = finalHeight * aspectRatio;
        }

        if (i > 0) {
            pdf.addPage();
        }
        
        // Center the image on the page if it's smaller than the page
        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = (pdfHeight - finalHeight) / 2;
        
        // Add the image to the PDF, letting jsPDF handle scaling to fit the page.
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
    }

    pdf.save(`${fileName}.pdf`);
}
