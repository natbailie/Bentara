// src/app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Microscope,
    LogOut,
    Menu,
    X
} from "lucide-react";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [user, setUser] = useState<{ name?: string } | null>(null);

    useEffect(() => {
        // Check for user session (simple mock check)
        // In a real app, you might check a cookie or token here
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Patient Directory", href: "/dashboard/patients", icon: <Users size={20} /> },
        { name: "Register Patient", href: "/dashboard/register", icon: <UserPlus size={20} /> },
        { name: "Upload Sample", href: "/dashboard/upload", icon: <Microscope size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile Menu Button */}
            <button
                className="fixed top-4 left-4 z-50 rounded-md bg-white p-2 shadow-md md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Sidebar Header */}
                <div className="flex h-20 items-center gap-3 border-b border-slate-700 px-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                        B
                    </div>
                    <span className="text-lg font-bold tracking-wide">Bentara</span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout Section */}
                <div className="border-t border-slate-800 p-4">
                    <div className="mb-4 flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-slate-700" />
                        <div className="text-xs">
                            <p className="font-bold text-white">{user?.name || "Clinician"}</p>
                            <p className="text-slate-500">Pathology Unit</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}