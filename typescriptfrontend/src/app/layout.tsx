// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- THIS IS CRITICAL. IT LOADS THE STYLES.

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "Bentara Pathology",
    description: "AI-Assisted Haematology Platform",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased`}>
        {children}
        </body>
        </html>
    );
}