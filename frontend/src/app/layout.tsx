import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choice Tailors - Smart Tailor Management",
  description: "AI-Powered Gents Tailoring and Order Digitization System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[#0D0D11]">
        {children}
      </body>
    </html>
  );
}
