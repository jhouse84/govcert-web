import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generate a professional PDF from text content and trigger browser download.
 * Uses pdf-lib (pure JS, no native deps, SSR-safe).
 */
export async function generatePDF(opts: {
  title: string;
  companyName: string;
  content: string;
  fileName: string;
  signatureImage?: string | null;
  clientId?: string | null;
  category?: string | null;
  apiUrl?: string;
}): Promise<void> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // Letter width in points
  const pageHeight = 792; // Letter height in points
  const margin = 60;
  const textWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  const fontSize = 10.5;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    // Page header
    page.drawText(opts.companyName + " — " + opts.title, { x: margin, y, font, size: 8, color: rgb(0.55, 0.55, 0.55) });
    y -= 24;
  }

  function checkPage(needed: number) {
    if (y - needed < margin + 30) newPage();
  }

  // ── Header ──
  page.drawText(opts.companyName, { x: margin, y, font, size: 9, color: rgb(0.45, 0.45, 0.45) });
  const headerRight = "GSA MAS eOffer Submission Document";
  const hrWidth = font.widthOfTextAtSize(headerRight, 9);
  page.drawText(headerRight, { x: pageWidth - margin - hrWidth, y, font, size: 9, color: rgb(0.45, 0.45, 0.45) });
  y -= 28;

  // ── Title ──
  page.drawText(opts.title, { x: margin, y, font: fontBold, size: 17, color: rgb(0.1, 0.14, 0.2) });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 2, color: rgb(0.78, 0.61, 0.24) });
  y -= 24;

  // ── Body — wrap text manually ──
  const paragraphs = opts.content.split("\n");

  for (const para of paragraphs) {
    if (para.trim() === "") { y -= 10; continue; }

    // Detect section headers
    const isHeader = /^[0-9]+\.?\s+[A-Z]/.test(para) || (/^[A-Z][A-Z\s/&(),.:]+$/.test(para.trim()) && para.trim().length > 3 && para.trim().length < 80);

    if (isHeader) {
      checkPage(30);
      y -= 6;
      page.drawText(para.trim(), { x: margin, y, font: fontBold, size: 11.5, color: rgb(0.1, 0.14, 0.2) });
      y -= 20;
      continue;
    }

    // Word-wrap the paragraph
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const testLine = line ? line + " " + word : word;
      const w = font.widthOfTextAtSize(testLine, fontSize);
      if (w > textWidth && line) {
        checkPage(lineHeight);
        page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0.16, 0.16, 0.16) });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPage(lineHeight);
      page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0.16, 0.16, 0.16) });
      y -= lineHeight;
    }
  }

  // ── Signature ──
  if (opts.signatureImage) {
    checkPage(90);
    y -= 16;
    page.drawText("Authorized Signature:", { x: margin, y, font, size: 9, color: rgb(0.3, 0.3, 0.3) });
    y -= 10;
    try {
      const sigBytes = Uint8Array.from(atob(opts.signatureImage.split(",")[1] || ""), c => c.charCodeAt(0));
      const sigImage = await pdf.embedPng(sigBytes);
      const sigDims = sigImage.scale(0.35);
      page.drawImage(sigImage, { x: margin, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
      y -= sigDims.height + 10;
    } catch {}
  }

  // ── Footer on every page ──
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const footText = `Page ${i + 1} of ${pages.length}`;
    const footWidth = font.widthOfTextAtSize(footText, 7);
    p.drawText(footText, { x: (pageWidth - footWidth) / 2, y: 28, font, size: 7, color: rgb(0.6, 0.6, 0.6) });
    const gcText = "Prepared with GovCert.ai";
    const gcWidth = font.widthOfTextAtSize(gcText, 7);
    p.drawText(gcText, { x: pageWidth - margin - gcWidth, y: 28, font, size: 7, color: rgb(0.6, 0.6, 0.6) });
  });

  // ── Save ──
  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

  // Download to user's computer
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.fileName;
  a.click();
  URL.revokeObjectURL(url);

  // Also save to GovCert as a Document record (for submit page)
  if (opts.clientId && opts.category) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const file = new File([blob], opts.fileName, { type: "application/pdf" });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", opts.clientId);
        formData.append("category", opts.category);
        await fetch(`${opts.apiUrl || "https://govcert-production.up.railway.app"}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
    } catch (e) {
      console.error("Failed to save PDF to GovCert documents:", e);
    }
  }
}
