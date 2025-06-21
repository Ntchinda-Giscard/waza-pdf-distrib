// import fs from 'fs';
// import path from 'path';
// import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Must set the worker
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';

export async function extractPdfTextFromFile(file: string): Promise<string[]> {
//   const arrayBuffer = await file.arrayBuffer();
//   const pdf = await getDocument({ data: arrayBuffer }).promise;
const pdf = await getDocument(file).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    pages.push(text);
  }

  return pages;
}
