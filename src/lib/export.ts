import type { DocumentItem } from "./types";
import { headerImageUrl } from "./constants";

/**
 * Converts an array of items to a CSV string.
 */
function convertToCSV(items: DocumentItem[]): string {
  const headers = ["البيان", "الوحدة", "الكمية", "السعر", "الإجمالي"];
  const rows = items.map(item => {
    const total = (item.quantity || 0) * (item.price || 0);
    // Ensure description with commas is wrapped in quotes
    const description = `"${item.description.replace(/"/g, '""')}"`;
    return [description, item.unit, item.quantity, item.price, total].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a file download in the browser.
 */
function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}


export async function exportToPdf(element: HTMLElement, fileName: string) {
    // Dynamically import html2pdf.js only on the client-side
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

/**
 * Converts an image URL to a Base64 string.
 * @param url The URL of the image.
 * @returns A promise that resolves with the Base64 string.
 */
async function imageToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


export async function exportToWord(element: HTMLElement, fileName: string) {
    const headerImageBase64 = await imageToBase64(headerImageUrl);

    let sourceHTML = element.innerHTML;

    // Replace the original image src with the Base64 version
    sourceHTML = sourceHTML.replace(
      /(<img[^>]+src=")([^"]+)("[^>]*alt="Company Header"[^>]*>)/,
      `$1${headerImageBase64}$3`
    );
    
    // Add inline styles for Word compatibility
    const tableStyle = 'border: 1px solid #000; border-collapse: collapse; width: 100%;';
    const cellStyle = 'border: 1px solid #000; padding: 5px;';
    
    sourceHTML = sourceHTML.replace(/<table/g, `<table style="${tableStyle}"`);
    sourceHTML = sourceHTML.replace(/<th/g, `<th style="${cellStyle}"`);
    sourceHTML = sourceHTML.replace(/<td/g, `<td style="${cellStyle}"`);


    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
        "xmlns:w='urn:schemas-microsoft-com:office:word' "+
        "xmlns='http://www.w3.org/TR/REC-html40'>"+
        "<head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
    const footer = "</body></html>";
    
    const finalHTML = header + sourceHTML + footer;
    
    downloadFile(finalHTML, `${fileName}.doc`, 'application/msword');
}

export function exportToExcel(items: DocumentItem[], fileName: string) {
    const csvContent = convertToCSV(items);
    // Add BOM for UTF-8 support in Excel
    const bom = new Uint8A-rray([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
