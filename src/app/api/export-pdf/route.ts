
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const ExportSchema = z.object({
  htmlContent: z.string(),
});

// Function to read the global CSS file content
const getGlobalCss = () => {
    try {
        const cssPath = path.resolve(process.cwd(), 'src', 'app', 'globals.css');
        return fs.readFileSync(cssPath, 'utf8');
    } catch (error) {
        console.error("Could not read globals.css:", error);
        return ''; // Return empty string if file not found or unreadable
    }
};

export async function POST(request: Request) {
  try {
    const jsonRequest = await request.json();
    const { htmlContent } = ExportSchema.parse(jsonRequest);
    
    const globalCss = getGlobalCss();
    const ptSansFontUrl = 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap';

    // Construct the full HTML to be rendered by Puppeteer
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="${ptSansFontUrl}">
          <style>
            ${globalCss}
            /* Override styles for PDF generation if needed */
            body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .a4-page {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 10mm 15mm 15mm 15mm !important;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });

    const page = await browser.newPage();
    
    // Set content and wait for network activity to cease, including font loading
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });

  } catch (error) {
    let errorMessage = 'An unknown error occurred during PDF generation.';
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('PDF Generation API Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
