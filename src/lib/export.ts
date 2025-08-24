import type { DocumentItem } from "./types";

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

export async function exportToWord(element: HTMLElement, fileName: string) {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
        "xmlns:w='urn:schemas-microsoft-com:office:word' "+
        "xmlns='http://www.w3.org/TR/REC-html40'>"+
        "<head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header+element.innerHTML+footer;
    
    downloadFile(sourceHTML, `${fileName}.doc`, 'application/msword');
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
