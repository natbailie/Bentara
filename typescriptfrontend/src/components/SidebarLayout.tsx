"use client";

import Link from "next/link";

export default function SidebarLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-6 space-y-6">
                <div className="flex flex-col items-center">
                    <img
                        src="/bentaralogo.jpg"
                        className="w-20 h-auto mb-4"
                        alt="Bentara Logo"
                    />
                    <h2 className="text-lg font-semibold text-center">
                        Bentara Pathology
                    </h2>
                </div>

                <nav className="space-y-3">
                    <Link href="/dashboard" className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-center">
                        Dashboard
                    </Link>
                    <Link href="/patients" className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-center">
                        Patients
                    </Link>
                    <Link href="/chart" className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-center">
                        Open Patient Chart
                    </Link>
                    <Link href="/compare" className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-center">
                        Compare
                    </Link>
                    <Link href="/settings" className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-center">
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-10">{children}</main>
        </div>
    );
}