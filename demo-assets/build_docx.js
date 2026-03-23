const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, PageBreak, ShadingType, ImageRun } = require("docx");

const NAVY = "0B1929";
const GOLD = "C89B3C";
const GRAY = "6B7280";
const imgDir = path.join(__dirname, "images");

function loadImg(name) {
  const p = path.join(imgDir, name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

function scene(num, title) {
  return new Paragraph({
    spacing: { before: 400, after: 100 },
    children: [
      new TextRun({ text: `SCENE ${num}: `, font: "Arial", size: 28, bold: true, color: GOLD }),
      new TextRun({ text: title, font: "Arial", size: 28, bold: true, color: NAVY }),
    ],
  });
}

function timing(text) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: GRAY, italics: true })],
  });
}

function img(filename, alt) {
  const data = loadImg(filename);
  if (!data) {
    return new Paragraph({
      spacing: { before: 100, after: 100 },
      shading: { fill: "F5F1E8", type: ShadingType.CLEAR },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: GOLD }, bottom: { style: BorderStyle.SINGLE, size: 2, color: GOLD }, left: { style: BorderStyle.SINGLE, size: 2, color: GOLD }, right: { style: BorderStyle.SINGLE, size: 2, color: GOLD } },
      children: [new TextRun({ text: `[SCREENSHOT MISSING: ${alt}]`, font: "Arial", size: 20, color: GRAY, italics: true })],
    });
  }
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({
      type: "jpg",
      data,
      transformation: { width: 680, height: 470 },
      altText: { title: alt, description: alt, name: filename },
    })],
  });
}

function narr(text) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: NAVY })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 } },
    children: [new TextRun({ text: "" })],
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: [
      // Title
      new Paragraph({ spacing: { before: 2000 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "GovCert", font: "Georgia", size: 72, bold: true, color: NAVY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: "HeyGen Demo Video Script", font: "Georgia", size: 36, color: GOLD }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Duration: ~5:35  |  Professional presenter, business casual", font: "Arial", size: 20, color: GRAY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Founder speaking to fellow business owners \u2014 confident, empathetic, authoritative", font: "Arial", size: 20, italics: true, color: GRAY }),
      ]}),
      new Paragraph({ children: [new PageBreak()] }),

      // S1
      scene("1", "THE FOUNDER STORY (0:00 \u2013 0:50)"), timing("50 seconds \u2014 Dark navy background with GovCert logo"),
      narr("The founders of GovCert are the founders of House Strategies Group \u2014 a government contracting firm that spent hours, weeks, months, and even years putting together certification applications for govcon contracting vehicles. Particularly 8(a) Business Development and GSA Multiple Award Schedule."),
      narr("Through that experience, one thing became painfully clear: all the information we needed to complete our applications was already available. Somewhere on our desk. In our inbox. In our Google Drive. Our tax returns were with our accountant. Our org chart was in a PowerPoint from last year. Our past performance references were scattered across three different email threads."),
      narr("And once we finally tracked everything down? We had to read it, analyze it, and reorganize it into the specific language that each application demands."),
      narr("There had to be an easier way."),
      divider(),

      // S2
      scene("2", "INTRODUCING GOVCERT (0:50 \u2013 1:15)"), timing("25 seconds"),
      img("02_landing.jpg", "GovCert Landing Page"),
      narr("GovCert is the answer to the question: what is the easier way?"),
      narr("AI has enabled quick, accurate, and high-quality document and data distillation \u2014 taking your raw documentation and making it into review-ready certification applications. Quickly. Accurately. At a quality level that used to take a team of consultants weeks to produce."),
      narr("Let me walk you through exactly how it works. Everything you\u2019re about to see is live."),
      divider(),

      // S3
      scene("3", "SIGN UP (1:15 \u2013 1:30)"), timing("15 seconds"),
      img("03_register.jpg", "Registration / Plan Selection"),
      narr("Creating an account takes thirty seconds. Choose between our Managed Service \u2014 where a dedicated GovCert advisor handles everything for you \u2014 or our Self-Service Platform, where you drive the process with our full AI toolkit. Both plans are free during our beta."),
      divider(),

      // S4
      scene("4", "THE ELIGIBILITY WIZARD (1:30 \u2013 2:10)"), timing("40 seconds"),
      img("04a_wizard_basics.jpg", "Eligibility Wizard \u2014 Business Basics"),
      narr("Once you\u2019re in, GovCert launches the Eligibility Wizard. You answer straightforward questions about your business \u2014 the basics like entity type, when you were established, and your NAICS codes. Then ownership demographics. Then financials \u2014 and if you use QuickBooks, connect it right here and we pull your revenue data automatically. No manual entry."),
      img("04b_wizard_docs.jpg", "Eligibility Wizard \u2014 Documents with AI Analysis"),
      narr("Then you upload your key documents \u2014 financial statements, tax returns, capability statements. Watch what happens. The moment you upload a document, GovCert\u2019s AI reads it, categorizes it, extracts the year, and identifies the key data points. That pricing sheet? We already know it covers 2025 through 2029 and we\u2019ve pulled every labor category and rate. That tax return? We know the fiscal year and your revenue numbers. All of this feeds directly into your application."),
      divider(),

      // S5
      scene("5", "ELIGIBILITY RESULTS (2:10 \u2013 2:35)"), timing("25 seconds"),
      img("05_results.jpg", "Eligibility Assessment Results"),
      narr("Click Run Eligibility Assessment and in seconds, GovCert analyzes everything you\u2019ve provided against the actual requirements for every major federal certification."),
      narr("You get an instant, clear answer. Which certifications you qualify for. Which ones you\u2019re close on. And exactly what\u2019s missing. Look at this \u2014 each criterion is checked against your data. Green checkmark means you meet it. Red X tells you exactly what needs to change. Required documents and required data are listed right there."),
      narr("No five-thousand-dollar consultant fee just to know where you stand."),
      divider(),

      // S6
      scene("6", "APPLICATION DASHBOARD (2:35 \u2013 3:00)"), timing("25 seconds"),
      img("06_dashboard.jpg", "GSA MAS Application Dashboard"),
      narr("Ready to apply? GovCert builds your full application dashboard. For GSA Schedule, you start by selecting your SIN codes \u2014 the service categories you want to offer under your contract."),
      narr("Your application immediately breaks down into every section GSA requires. Corporate Experience. Quality Control Plan. Past Performance \u2014 you need three references. Project Experience for each SIN you selected. Financials. And your CSP-1 pricing. You can see your progress at a glance. Green checkmarks mean those sections are done. You know exactly what\u2019s left."),
      divider(),

      // S7
      scene("7", "AI-POWERED NARRATIVES (3:00 \u2013 3:35)"), timing("35 seconds"),
      img("07a_corporate.jpg", "Corporate Experience \u2014 AI Narratives"),
      narr("Here\u2019s where GovCert saves you weeks of work. Click one button, and AI drafts your entire Corporate Experience narrative \u2014 all eight sections. Company overview, core capabilities, employee qualifications, organizational controls, resources, past projects, marketing plan, and subcontractor management."),
      narr("This is not generic filler. Look at this \u2014 it references your company by name, mentions your certifications, your SAM.gov registration, your NAICS code, your specific services. GovCert uses everything it knows about your business to write specific, professional narratives tailored to your company."),
      img("07b_qcp.jpg", "Quality Control Plan"),
      narr("Same thing for your Quality Control Plan. GovCert automatically incorporates your QC attributes \u2014 PMP certifications, PMBOK framework, SharePoint and Confluence platforms \u2014 into detailed, GSA-compliant narrative sections. Every section is editable. Use the Redraft button to regenerate any section, or Speak to dictate changes with your voice."),
      narr("And it stays within GSA\u2019s ten-thousand-character limit automatically. You can see the counter right there \u2014 eight thousand two hundred seventy-one out of ten thousand."),
      divider(),

      // S8
      scene("8", "PAST PERFORMANCE & PPQ (3:35 \u2013 4:05)"), timing("30 seconds"),
      img("08_pastperf.jpg", "Past Performance + PPQ Tracking"),
      narr("Past performance references are usually the most painful part of any certification. You need three, and you need them to fill out formal questionnaires. GovCert makes it painless."),
      narr("Add your contracts, enter your reference\u2019s name and email, and GovCert\u2019s AI drafts a personalized email requesting the questionnaire. Your reference receives a clean, professional form with ratings, narrative questions, and a signature pad. You can track every reference in real time \u2014 look, this one shows PPQ Completed, this one shows PPQ Opened. When they submit, GovCert automatically generates a signed PDF and adds it to your documents."),
      divider(),

      // S9
      scene("9", "PRICING & CSP-1 (4:05 \u2013 4:25)"), timing("20 seconds"),
      img("09_pricing.jpg", "Pricing CSP-1 Builder"),
      narr("For GSA Schedule, you also need a Commercial Supplier Pricelist \u2014 your CSP-1. GovCert\u2019s pricing builder lets you add labor categories, benchmark your rates against market data, and run gap analysis against your SINs. Upload your invoices and our AI extracts your service lines automatically."),
      narr("Look at these three labor categories \u2014 SharePoint Developer, Project Manager, Subject Matter Expert. Each shows education requirements, experience level, your commercial rate, and the IFF-adjusted GSA rate calculated automatically. When you\u2019re done, export your formatted CSP-1 ready to upload directly into eOffer."),
      divider(),

      // S10
      scene("10", "EOFFER SUBMISSION \u2014 YOUR COPY-PASTE COMPANION (4:25 \u2013 5:05)"), timing("40 seconds"),
      img("10_eoffer.jpg", "eOffer Submission Package"),
      narr("Now let\u2019s talk about what everyone dreads \u2014 the actual submission."),
      narr("If you\u2019ve ever spoken to a government contractor about submitting a GSA MAS application, you\u2019ve heard the horror stories. Industry surveys consistently show that most small businesses spend four to six months preparing their GSA Schedule offer. Some take over a year. Between gathering documents, writing narratives, collecting references, building your CSP-1, and figuring out which field goes where in eOffer \u2014 it\u2019s overwhelming. That\u2019s why so many businesses either give up halfway through or pay fifteen to twenty-five thousand dollars to a consultant to do it for them."),
      narr("With GovCert, we\u2019ve seen users go from first login to a submission-ready package in under two weeks. Some in days."),
      narr("And this page \u2014 the eOffer Submission Package \u2014 is your copy-paste companion for the final stretch. Think of it as your cheat sheet that sits open on one side of your screen while GSA eOffer sits on the other."),
      narr("Every field your application needs is organized by eOffer tab. Corporate Experience \u2014 all eight sections, done. Quality Control Plan \u2014 all six sections, done. Past Performance documents ready to upload. Your CSP-1 ready to download."),
      narr("You open eOffer, you open GovCert, and you go field by field. Click Copy. Switch to eOffer. Paste. Next field. Copy. Paste. That\u2019s it. The actual submission process takes about an hour \u2014 because GovCert already did the hard part."),
      narr("Four to six months of work, compressed into days \u2014 and a submission process that\u2019s as simple as copy, paste, submit."),
      divider(),

      // S11
      scene("11", "THE CLOSE (5:05 \u2013 5:35)"), timing("30 seconds"),
      img("02_landing.jpg", "Landing Page / CTA"),
      narr("We built GovCert because we lived this pain ourselves. At House Strategies Group, we spent years navigating the certification process \u2014 for our own business and for our clients. We knew every piece of information we needed was already in our hands. We just needed a smarter way to turn it into an application."),
      narr("AI has made that possible. GovCert takes your raw documents \u2014 your tax returns, your invoices, your capability statements, your past proposals \u2014 and distills them into a complete, review-ready certification application. What the industry says takes four to six months, GovCert helps you do in days."),
      narr("No more hunting for documents. No more staring at blank narrative fields wondering what to write. No more chasing references. No more guessing which field goes where in eOffer."),
      narr("Built by government contractors. For government contractors."),
      narr("Start your free trial today at govcert dot A-I. Your next certification is closer than you think."),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = path.join(__dirname, "GovCert_HeyGen_Demo_Script.docx");
  fs.writeFileSync(out, buffer);
  console.log("Created: " + out + " (" + buffer.length + " bytes)");
});
