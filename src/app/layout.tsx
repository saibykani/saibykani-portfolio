import type { Metadata } from "next";
import "./globals.css";
import EffectsLayer from "@/components/EffectsLayer";

export const metadata: Metadata = {
  title: "Sai Krishna Bykani | QA Automation Engineer & SDET Portfolio",
  description: "Portfolio of Sai Krishna Bykani, QA Automation Engineer & SDET specializing in premium testing frameworks, API validations, and performance scaling under concurrent peak loads.",
  keywords: [
    "Sai Krishna Bykani",
    "SDET",
    "QA Automation Engineer",
    "Automation Architect",
    "Java",
    "Selenium",
    "REST Assured",
    "JMeter",
    "Fintech QA",
    "Payment Gateway Automation",
    "Software Quality Engineer"
  ],
  authors: [{ name: "Sai Krishna Bykani" }],
  creator: "Sai Krishna Bykani",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://saibykani.dev",
    title: "Sai Krishna Bykani | QA Automation Engineer & SDET",
    description: "QA Automation Engineer specializing in robust UI/API test automation frameworks, UPI transaction load testing, and database reconciliations.",
    siteName: "Sai Krishna Bykani Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sai Krishna Bykani | QA Automation Engineer & SDET",
    description: "QA Automation Engineer specializing in UI/API test automation and distributed load testing.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* pick the hero sky for the visitor's local time and start downloading it before any JS boots */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get('sky');var h=new Date().getHours();var p=q||(h>=5&&h<9?'sunrise':h>=9&&h<16?'day':h>=16&&h<19?'sunset':'night');var m=innerWidth<768?'-m':'';var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/photos/hero-'+p+m+'.webp';l.setAttribute('fetchpriority','high');document.head.appendChild(l);}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@200..800&family=Press+Start+2P&display=swap"
        />
      </head>
      <body
        className={`font-outfit antialiased text-foreground min-h-screen relative overflow-x-hidden`}
      >

        {children}

        <EffectsLayer />
      </body>
    </html>
  );
}
