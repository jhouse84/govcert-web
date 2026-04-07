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
  headerLabel?: string;
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
    page.drawText(sanitize(opts.companyName + " -- " + opts.title), { x: margin, y, font, size: 8, color: rgb(0.55, 0.55, 0.55) });
    y -= 24;
  }

  function checkPage(needed: number) {
    if (y - needed < margin + 30) newPage();
  }

  // ── Header ──
  page.drawText(sanitize(opts.companyName), { x: margin, y, font, size: 9, color: rgb(0.45, 0.45, 0.45) });
  const headerRight = opts.headerLabel || "GSA MAS eOffer Submission Document";
  const hrWidth = font.widthOfTextAtSize(headerRight, 9);
  page.drawText(headerRight, { x: pageWidth - margin - hrWidth, y, font, size: 9, color: rgb(0.45, 0.45, 0.45) });
  y -= 28;

  // ── Title ──
  page.drawText(sanitize(opts.title), { x: margin, y, font: fontBold, size: 17, color: rgb(0.1, 0.14, 0.2) });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 2, color: rgb(0.78, 0.61, 0.24) });
  y -= 24;

  // ── Sanitize text for pdf-lib (StandardFonts only support WinAnsi/Latin1) ──
  function sanitize(text: string): string {
    return text
      .replace(/[\u2018\u2019\u201A]/g, "'")   // smart single quotes → '
      .replace(/[\u201C\u201D\u201E]/g, '"')   // smart double quotes → "
      .replace(/\u2014/g, '--')                 // em dash → --
      .replace(/\u2013/g, '-')                  // en dash → -
      .replace(/\u2026/g, '...')                // ellipsis → ...
      .replace(/\u2022/g, '*')                  // bullet → *
      .replace(/\u00A0/g, ' ')                  // non-breaking space
      .replace(/\u2019/g, "'")                  // right single quote
      .replace(/[^\x00-\xFF]/g, '');            // strip anything outside Latin1
  }

  // ── Body — wrap text manually ──
  const paragraphs = sanitize(opts.content).split("\n");

  for (const para of paragraphs) {
    if (para.trim() === "") { y -= 10; continue; }

    // Detect section headers
    const isHeader = /^[0-9]+\.?\s+[A-Z]/.test(para) || (/^[A-Z][A-Z\s/&(),.:]+$/.test(para.trim()) && para.trim().length > 3 && para.trim().length < 80);

    if (isHeader) {
      checkPage(30);
      y -= 6;
      page.drawText(sanitize(para.trim()), { x: margin, y, font: fontBold, size: 11.5, color: rgb(0.1, 0.14, 0.2) });
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

/**
 * Compile ALL reviewable sections of an application into a single DOCX for executive review.
 */
export async function compileReviewDOCX(opts: {
  companyName: string;
  certType: string;
  sections: { title: string; content: string }[];
  fileName: string;
}): Promise<{ blob: Blob; base64: string }> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, PageBreak } = await import("docx");

  const children: any[] = [];

  // Cover page
  children.push(new Paragraph({ spacing: { before: 2000 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: opts.companyName, size: 48, bold: true, color: "1A2332" })],
    alignment: AlignmentType.CENTER,
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${opts.certType === "GSA_MAS" ? "GSA Multiple Award Schedule" : opts.certType === "EIGHT_A" ? "8(a) Business Development" : "OASIS+"} Application`, size: 28, color: "666666" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "EXECUTIVE REVIEW DOCUMENT", size: 32, bold: true, color: "C89B3C" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, size: 22, color: "999999" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "Please review all sections below. Use Track Changes in Word to mark your edits and add comments where needed.", size: 22, color: "555555", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 2000 },
  }));

  // Table of contents summary
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "SECTIONS FOR REVIEW", size: 28, bold: true, color: "1A2332" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "C89B3C" } },
  }));
  for (let i = 0; i < opts.sections.length; i++) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `${i + 1}. ${opts.sections[i].title}`, size: 22, color: "333333" })],
      spacing: { after: 60 },
    }));
  }
  children.push(new Paragraph({ spacing: { after: 400 } }));

  // Each section
  for (let i = 0; i < opts.sections.length; i++) {
    const section = opts.sections[i];
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Section ${i + 1}: ${section.title}`, size: 28, bold: true, color: "1A2332" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "C89B3C" } },
    }));

    // Split content into paragraphs
    for (const para of section.content.split("\n")) {
      if (para.trim() === "") {
        children.push(new Paragraph({ spacing: { after: 80 } }));
        continue;
      }
      const isHeader = /^[0-9]+\.?\s+[A-Z]/.test(para) || (/^[A-Z][A-Z\s/&(),.:]+$/.test(para.trim()) && para.trim().length > 3 && para.trim().length < 80);
      if (isHeader) {
        children.push(new Paragraph({
          children: [new TextRun({ text: para.trim(), bold: true, size: 24, color: "1A2332" })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: para, size: 22, color: "333333" })],
          spacing: { after: 60, line: 360 },
        }));
      }
    }
  }

  // Footer
  children.push(new Paragraph({ spacing: { before: 600 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "Prepared with GovCert.ai — Please use Track Changes for all edits", size: 18, color: "AAAAAA", italics: true })],
    alignment: AlignmentType.CENTER,
  }));

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }],
  });

  const blob = await Packer.toBlob(doc);

  // Convert to base64 for email attachment
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  const base64 = btoa(binary);

  return { blob, base64 };
}

/**
 * Generate a Word document (.docx) from text content.
 * User can edit the content in Word before uploading to the government portal.
 */
export async function generateDOCX(opts: {
  title: string;
  companyName: string;
  content: string;
  fileName: string;
}): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");

  const paragraphs = opts.content.split("\n");
  const children: any[] = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({ text: opts.companyName, size: 20, color: "808080" })],
    spacing: { after: 100 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: opts.title, size: 36, bold: true, color: "1A2332" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "C89B3C" } },
  }));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Body
  for (const para of paragraphs) {
    if (para.trim() === "") {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    const isHeader = /^[0-9]+\.?\s+[A-Z]/.test(para) || (/^[A-Z][A-Z\s/&(),.:]+$/.test(para.trim()) && para.trim().length > 3 && para.trim().length < 80);

    if (isHeader) {
      children.push(new Paragraph({
        children: [new TextRun({ text: para.trim(), bold: true, size: 24, color: "1A2332" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: para, size: 22, color: "333333" })],
        spacing: { after: 80, line: 360 },
      }));
    }
  }

  // Footer
  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "Prepared with GovCert.ai", size: 16, color: "AAAAAA", italics: true })],
    alignment: AlignmentType.RIGHT,
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.fileName;
  a.click();
  URL.revokeObjectURL(url);
}
