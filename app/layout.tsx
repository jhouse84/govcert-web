import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ChatWidgetWrapper from "@/components/ChatWidgetWrapper";
import SessionTimeout from "@/components/SessionTimeout";

export const metadata: Metadata = {
  title: {
    default: "GovCert — AI-Powered Government Certification Prep | 8(a), GSA MAS, OASIS+",
    template: "%s | GovCert",
  },
  description: "Automate your 8(a), GSA MAS, and OASIS+ certification applications with AI. Upload documents, get instant eligibility scoring, AI-drafted narratives, and step-by-step submission guides. A fraction of consultant cost.",
  keywords: ["8a certification", "GSA schedule application", "OASIS+ application", "government certification", "SBA 8a", "GSA MAS", "small business certification", "GovCert", "certification automation"],
  authors: [{ name: "House Strategies Group LLC" }],
  creator: "GovCert",
  metadataBase: new URL("https://govcert.ai"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://govcert.ai",
    siteName: "GovCert",
    title: "GovCert — AI-Powered Government Certification Prep",
    description: "Automate your 8(a), GSA MAS, and OASIS+ certification applications with AI. Upload documents, get instant eligibility scoring, and AI-drafted narratives.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GovCert — Government Certification Automation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GovCert — AI-Powered Government Certification Prep",
    description: "Automate your 8(a), GSA MAS, and OASIS+ applications. AI does the heavy lifting.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        {/* Schema.org structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "GovCert",
              "url": "https://govcert.ai",
              "logo": "https://govcert.ai/og-image.png",
              "description": "AI-powered government certification application preparation for small businesses",
              "contactPoint": { "@type": "ContactPoint", "telephone": "+1-434-981-5295", "contactType": "sales" },
              "founder": { "@type": "Person", "name": "Jelani House" },
              "parentOrganization": { "@type": "Organization", "name": "House Strategies Group LLC" },
              "sameAs": ["https://www.linkedin.com/company/govcert-ai"]
            },
            {
              "@type": "SoftwareApplication",
              "name": "GovCert",
              "url": "https://govcert.ai",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "AI-powered platform that automates 8(a), GSA MAS, and OASIS+ certification applications for small businesses",
              "offers": { "@type": "Offer", "price": "1000", "priceCurrency": "USD", "description": "Single certification prep" }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": "How much does GovCert cost?", "acceptedAnswer": { "@type": "Answer", "text": "GovCert costs $1,000 per certification (8(a), GSA MAS, or OASIS+) or $2,000 for a bundle. Human help is included in the price." }},
                { "@type": "Question", "name": "What certifications does GovCert support?", "acceptedAnswer": { "@type": "Answer", "text": "GovCert supports 8(a) Business Development, GSA Multiple Award Schedule (MAS), GSA OASIS+, WOSB, SDVOSB, and HUBZone certification preparation." }},
                { "@type": "Question", "name": "How does GovCert work?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your business documents. GovCert's AI reads every file, extracts key data, pre-fills your eligibility assessment, drafts regulation-compliant narratives, and provides step-by-step submission guides." }},
                { "@type": "Question", "name": "Is GovCert secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. GovCert uses AES-256 encryption, PII auto-detection, audit logging on every document access, and is D&B verified (D-U-N-S: 105595626)." }}
              ]
            }
          ]
        }) }} />
        {/* Google Ads conversion tracking */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-18057284692" strategy="afterInteractive" />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18057284692');
          `}
        </Script>
      </head>
      <body>
        {children}
        <ChatWidgetWrapper />
        <SessionTimeout />
      </body>
    </html>
  );
}