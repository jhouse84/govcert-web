const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, BorderStyle } = require("docx");
const fs = require("fs");

const scenes = [
  { title: "SCENE 1: THE PROBLEM", duration: "30 seconds",
    visual: "Show landing page hero \u2014 Capitol building, Certifications that open doors",
    script: "If you\u2019ve ever tried to get your small business certified for government contracting, you know the pain. I\u2019m talking about 8(a), GSA Schedule, WOSB, HUBZone \u2014 these certifications that can transform your business, but the process to get them? It\u2019s brutal.\n\nI know because we lived it. The founders of GovCert are the founders of House Strategies Group \u2014 a government contracting firm that spent weeks, months, and honestly, years putting together certification applications. The information we needed was always somewhere \u2014 on our desk, in our inbox, buried in Google Drive. And once we found it, we still had to analyze it and organize it into the exact language these applications require.\n\nThere had to be an easier way. And now there is." },
  { title: "SCENE 2: INTRODUCING GOVCERT", duration: "20 seconds",
    visual: "Show landing page scrolled to demo video section and features grid",
    script: "GovCert is an AI-powered certification platform that takes your raw business documents \u2014 your proposals, financial statements, capability statements \u2014 and transforms them into review-ready certification applications. What used to take months now takes days. What used to cost thousands in consulting fees, you can do yourself." },
  { title: "SCENE 3: GETTING STARTED", duration: "30 seconds",
    visual: "Show registration page, then portal home with eligibility overview",
    script: "Getting started takes about two minutes. You create your account, and the first thing you see is your Client Portal. Right away, GovCert runs you through an eligibility assessment \u2014 a quick guided wizard that asks about your business basics, ownership, financials, and past performance.\n\nWithin minutes, you get a personalized eligibility breakdown showing which certifications you qualify for and at what confidence level. For House Strategies Group, we\u2019re showing 71% for 8(a), 80% for HUBZone, 70% for SDVOSB \u2014 and these scores update as you provide more information." },
  { title: "SCENE 4: COMPANY PROFILE", duration: "20 seconds",
    visual: "Show Company Profile page with SAM.gov lookup and AI document scan",
    script: "Before you even start an application, you set up your Company Profile. This is your single source of truth \u2014 and here\u2019s where the magic starts. Enter your UEI or CAGE code, and we pull your registration data directly from SAM.gov. Or click AI Document Scan and our AI reads through every document you\u2019ve uploaded to extract your business name, EIN, address, NAICS codes \u2014 everything. It auto-fills the profile for you." },
  { title: "SCENE 5: STARTING AN APPLICATION", duration: "20 seconds",
    visual: "Show certification dashboard with 8(a) sections",
    script: "Once your profile is set, you pick your certification and start your application. Let me show you the 8(a) Business Development application \u2014 it\u2019s the most complex certification out there, and it\u2019s where GovCert really shines.\n\nYou\u2019ll see six application sections, each with its own AI-powered workflow. Let me walk you through the most important ones." },
  { title: "SCENE 6: SOCIAL DISADVANTAGE NARRATIVE", duration: "45 seconds",
    visual: "Show Social Disadvantage page with guided questions, coaching prompts, and AI narrative with strength score",
    script: "The Social Disadvantage Narrative is the heart of any 8(a) application \u2014 and it\u2019s where most people struggle. SBA requires you to prove chronic and substantial social disadvantage with specific incidents, dates, and impact.\n\nGovCert guides you through this with seven targeted questions, each with coaching prompts that help you recall experiences you might not think to include. There\u2019s a Need Help button on every question with specific memory-joggers \u2014 like think of a time something went wrong in your career, trace it back, was bias involved?\n\nOnce you\u2019ve answered the questions, hit Generate Narrative and our AI \u2014 trained on actual SBA regulatory standards under 13 CFR 124.103 \u2014 drafts a compliant narrative. But here\u2019s what makes this special: it scores your narrative on a scale of 1 to 10, shows you exactly which SBA requirements you\u2019ve covered, identifies gaps, and asks follow-up questions to strengthen your story. Each round, the score improves. The AI is literally coaching you toward an approvable narrative." },
  { title: "SCENE 7: ECONOMIC DISADVANTAGE", duration: "30 seconds",
    visual: "Show Economic Disadvantage page with three smart auto-populate tools",
    script: "The Economic Disadvantage section used to mean hours of digging through financial records. GovCert gives you three smart tools to auto-populate everything.\n\nFirst, Scan My Documents \u2014 our AI reads your uploaded tax returns and financial statements to extract assets, liabilities, and income history automatically. Second, the Property Estimator \u2014 enter any address you own and get an instant market value estimate. Third, the Vehicle Estimator \u2014 enter your car\u2019s year, make, and model, or scan the VIN, and get a fair market value.\n\nAll the data flows into the SBA Form 413 format with real-time threshold calculations. You can see instantly whether your net worth is under 850,000 dollars and your assets are under 6.5 million." },
  { title: "SCENE 8: BUSINESS PLAN", duration: "30 seconds",
    visual: "Show Business Plan page with document-first panel and guided questions pre-filled by AI",
    script: "The Business Plan section uses our document-first approach. If you have proposals, capability statements, or an existing business plan uploaded, click Scan Documents and our AI reads them to pre-fill all eight guided questions.\n\nYou review the pre-filled answers, make any edits, and then hit Generate Business Plan. The AI writes all eight SBA-required sections \u2014 executive summary, market analysis, financial projections, growth targets \u2014 all of it, in one click. Then you refine each section individually." },
  { title: "SCENE 9: GSA MAS APPLICATION", duration: "30 seconds",
    visual: "Show GSA MAS cert dashboard with Corporate Experience, QCP, Project Experience, Pricing sections",
    script: "GovCert handles GSA Multiple Award Schedule applications too. The Corporate Experience section uses the same two-mode system \u2014 upload documents, answer guided questions, and the AI generates all eight GSA-required narrative sections.\n\nThe Quality Control Plan, Project Experience per SIN code, Past Performance references with automated PPQ emails to your references, and a full CSP-1 pricing tool for your labor categories \u2014 it\u2019s all here." },
  { title: "SCENE 10: GOVCERT REVIEW", duration: "45 seconds",
    visual: "Show GovCert Review page with overall score, section-by-section analysis, critical issues, and strengths",
    script: "And this is my favorite feature \u2014 the GovCert Application Review. Before you submit anything, click Run GovCert Analysis and our AI performs a comprehensive review of your entire application against the actual regulatory standards.\n\nYou get an overall readiness score out of 100, a section-by-section breakdown with individual scores, specific findings telling you exactly what\u2019s weak, specific improvements telling you exactly how to fix it, and the regulatory basis for every recommendation. Critical issues are flagged in red. Strengths are highlighted in green.\n\nMake improvements, come back, re-run the analysis, and watch your score climb. It\u2019s like having a 500-dollar-an-hour government contracting attorney review your application \u2014 except it takes 30 seconds and it\u2019s built into the platform." },
  { title: "SCENE 11: SUBMISSION", duration: "20 seconds",
    visual: "Show eOffer Submission page with copy-to-clipboard fields and CSP-1 download",
    script: "When your application is ready, the eOffer Submission page is your copy-paste companion. Every field is mapped to the exact tab and field in GSA eOffer or SBA Certify. Click Copy, paste it in. Your CSP-1 pricing spreadsheet is ready to download. All your past performance documents are organized. The hard part is done." },
  { title: "SCENE 12: CLOSING", duration: "30 seconds",
    visual: "Show landing page with Start Free Trial CTA",
    script: "Most people say it takes 3 to 6 months to complete a GSA Schedule application, and 8(a) can take even longer. With GovCert, we\u2019ve seen users get through it in days \u2014 not months.\n\nYour information is out there. Your proposals, your financials, your capability statements \u2014 they already contain everything you need. GovCert just makes it usable.\n\nWe\u2019re offering free trials right now. Go to govcert-web.vercel.app, create your account, and see what your application looks like in 24 hours. The doors are right there \u2014 GovCert helps you open them." },
];

const children = [];

// Title page
children.push(
  new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GovCert Platform Demo Script", font: "Arial", size: 48, bold: true, color: "0B1929" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "HeyGen Production \u2014 Version 2.0", font: "Arial", size: 28, color: "C89B3C" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "March 2026", font: "Arial", size: 22, color: "666666" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "Duration: ~5-6 minutes  |  Tone: Natural, conversational, founder-passionate", font: "Arial", size: 20, color: "888888" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Demo Video: https://youtu.be/SVfWc-31Xbw", font: "Arial", size: 20, color: "C89B3C" })] }),
  new Paragraph({ children: [new PageBreak()] })
);

// Production notes
children.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Production Notes", font: "Arial", size: 32, bold: true, color: "0B1929" })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Avatar Delivery: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "Maintain eye contact, speak naturally \u2014 like a founder showing off their product to a friend. Vary pace and emphasis. Not robotic.", font: "Arial", size: 22 })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Key Phrases: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "\"days, not months\" \u2014 \"coaching you toward an approvable narrative\" \u2014 \"500-dollar-an-hour attorney\" \u2014 \"the doors are right there\"", font: "Arial", size: 22 })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Music: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "Subtle, professional background. Build energy toward GovCert Review and closing.", font: "Arial", size: 22 })] }),
  new Paragraph({ children: [new PageBreak()] })
);

// Scenes
for (const scene of scenes) {
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300 }, children: [new TextRun({ text: scene.title, font: "Arial", size: 32, bold: true, color: "0B1929" })] }),
    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Duration: " + scene.duration, font: "Arial", size: 20, color: "C89B3C", bold: true })] }),
    new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E0D9C8" } }, children: [new TextRun({ text: "VISUAL: ", font: "Arial", size: 20, bold: true, color: "2563EB" }), new TextRun({ text: scene.visual, font: "Arial", size: 20, italics: true, color: "2563EB" })] }),
    new Paragraph({ spacing: { before: 100, after: 60 }, children: [new TextRun({ text: "AVATAR SCRIPT:", font: "Arial", size: 20, bold: true, color: "666666" })] })
  );
  const paragraphs = scene.script.split("\n\n");
  for (const p of paragraphs) {
    children.push(new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "\u201C" + p.trim() + "\u201D", font: "Arial", size: 24, color: "1a1a1a" })] }));
  }
  children.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C89B3C" } }, children: [] }));
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 24 } } }, paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("GovCert_HeyGen_Demo_Script_V2.docx", buffer);
  console.log("Created GovCert_HeyGen_Demo_Script_V2.docx (" + (buffer.length / 1024).toFixed(0) + " KB)");
});
