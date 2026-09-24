import type { Metadata } from "next";
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

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
      <body
        className={`${outfit.className} ${outfit.variable} ${instrument.variable} ${mono.variable} antialiased bg-black text-foreground min-h-screen relative overflow-x-hidden`}
      >
        {/* Bottom viewport blur fade */}
        <div className="pointer-events-none blur-wrapper fixed left-0 z-40 w-full select-none bg-gradient-to-t from-black/30 to-transparent no-print" />

        {/* Subtle Film Grain Noise */}
        <div className="noise-texture no-print" />

        {children}
      </body>
    </html>
  );
}
