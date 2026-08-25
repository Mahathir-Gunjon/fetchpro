import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadFlow - B2B Lead Generation & Automated Website Audit SaaS",
  description: "Scrape Google Maps leads with Manifest V3 Chrome Extension, perform automated website audits, generate high-converting AI cold pitches with Gemini, and dispatch outreach via Resend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
