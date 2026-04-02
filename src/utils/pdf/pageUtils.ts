import type jsPDF from 'jspdf';
import { PAGE, FOOTER_HEIGHT } from './constants';

/**
 * If content won't fit on the current page, add a new page and return reset Y.
 */
export function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > PAGE.height - FOOTER_HEIGHT - 4) {
    doc.addPage();
    return PAGE.margin;
  }
  return currentY;
}

/**
 * Load an image URL as a base64 data URL.
 */
export function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not available');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
  });
}
