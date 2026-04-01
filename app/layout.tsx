import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ChatWidgetWrapper from "@/components/ChatWidgetWrapper";
import SessionTimeout from "@/components/SessionTimeout";

export const metadata: Metadata = {
  title: "GovCert — Government Certification Automation",
  description: "Streamline your government certification applications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
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