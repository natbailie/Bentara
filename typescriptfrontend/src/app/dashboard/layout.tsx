"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserPlus,
    UploadCloud,
    Database,
    Settings,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState({ name: "Clinician", role: "Pathology Unit" });

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const p = JSON.parse(stored);
                setUser({ name: p.name, role: p.details.trust || "Pathology Unit" });
            } catch (e) {}
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Patient Directory", href: "/dashboard/patients", icon: Users },
        { name: "Register Patient", href: "/dashboard/register", icon: UserPlus },
        { name: "Upload Sample", href: "/dashboard/upload", icon: UploadCloud },
        { name: "Research Lab", href: "/dashboard/research", icon: Database }, // <--- NEW
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* SIDEBAR (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full transition-all z-50">

                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3 text-white font-bold text-xl tracking-tight border-b border-slate-800">
                    {/* Ensure this path matches your public folder file */}
                    <img src="/bentaralogo.jpg" className="w-8 h-8 rounded-md bg-white p-1" alt="Logo" />
                    BENTARA
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Clinical</p>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                        : "hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className="h-px bg-slate-800 my-4 mx-4" />

                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System</p>

                    {/* Settings Link (NEW) */}
                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            pathname === "/dashboard/settings"
                                ? "bg-blue-600 text-white shadow-lg"
                                : "hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 justify-center p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors text-sm font-bold"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed w-full bg-slate-900 text-white z-50 flex justify-between items-center p-4 shadow-md">
        <span className="font-bold text-lg flex items-center gap-2">
          <img src="/bentaralogo.jpg" className="w-6 h-6 rounded bg-white p-0.5" /> BENTARA
        </span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-900 z-40 pt-20 px-6 space-y-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 p-4 rounded-xl text-lg font-medium ${
                                pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 bg-slate-800"
                            }`}
                        >
                            <item.icon size={24} />
                            {item.name}
                        </Link>
                    ))}
                    <Link
                        href="/dashboard/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl text-lg font-medium text-slate-300 bg-slate-800"
                    >
                        <Settings size={24} /> Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-4 rounded-xl text-lg font-medium text-red-400 bg-slate-800 mt-8"
                    >
                        <LogOut size={24} /> Sign Out
                    </button>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
                {children}
            </main>

        </div>
    );
}