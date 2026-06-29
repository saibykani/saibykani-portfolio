import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SpotlightCursor from "@/components/SpotlightCursor";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
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
        className={`${jakarta.className} ${jakarta.variable} antialiased bg-background text-foreground min-h-screen relative overflow-x-hidden transition-colors duration-300`}
      >
        {/* Spotlight Follow Glow */}
        <SpotlightCursor />

        {/* Dynamic Faint Grid and Mesh Gradient matching Ahmed's site */}
        <div className="aurora-container">
          <div className="aurora-mesh" />
          <div className="aurora-ambiance">
            <div className="aurora-sphere-1" />
            <div className="aurora-sphere-2" />
          </div>
          <div className="aurora-grid" />
        </div>
        
        {/* Subtle Film Grain Noise */}
        <div className="noise-texture" />
        
        {/* Main Page Layout Wrapper */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
