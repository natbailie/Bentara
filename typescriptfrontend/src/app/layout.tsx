import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- THIS LINE IS ESSENTIAL

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Bentara Pathology",
    description: "AI-Assisted Haematology",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={inter.className}>{children}</body>
        </html>
    );
}