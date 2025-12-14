import "./globals.css";
import SidebarLayout from "@/components/SidebarLayout";

export const metadata = {
    title: "Bentara Pathology",
    description: "AI-assisted haematology diagnostics",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="bg-gray-100">
        <SidebarLayout>{children}</SidebarLayout>
        </body>
        </html>
    );
}