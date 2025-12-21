"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    UploadCloud,
    Settings,
    LogOut,
    Menu,
    X,
    Database,
    Clock
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<{ full_name: string; role: string; username: string } | null>(null);
    const [mounted, setMounted] = useState(false); // NEW: Fixes Hydration Error

    useEffect(() => {
        setMounted(true); // Mark component as mounted on client

        // 1. Load User Details
        const storedUser = localStorage.getItem("user_details");

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.warn("Corrupted user data found. Resetting session.");
                localStorage.removeItem("user_details");
                localStorage.removeItem("access_token");
                router.push('/');
            }
        } else {
            router.push('/');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_details");
        router.push('/');
    };

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Pending Reviews', href: '/dashboard/reviews', icon: Clock },
        { name: 'Patient Directory', href: '/dashboard/patients', icon: Users },
        { name: 'Register Patient', href: '/dashboard/register', icon: UserPlus },
        { name: 'Upload Sample', href: '/dashboard/upload', icon: UploadCloud },
        { name: 'Research Lab', href: '/dashboard/research', icon: Database },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <div className="flex h-screen bg-slate-50"></div>;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">

            {/* MOBILE TOGGLE */}
            <button
                className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* SIDEBAR */}
            <aside
                className={`
          bg-slate-900 text-white w-64 flex-shrink-0 flex flex-col transition-all duration-300 absolute md:relative z-40 h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                {/* LOGO AREA */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden">
                            <img src="/bentaralogo.jpg" alt="Logo" className="w-full h-full object-contain"/>
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none">BENTARA</span>
                            <span className="text-[10px] text-blue-400 font-mono">CLINICAL</span>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* USER PROFILE (BOTTOM) */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                            {user?.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden w-full">
                            <p className="text-sm font-bold text-white truncate">{user?.full_name || "Loading..."}</p>

                            {/* UPDATED: Displays Role AND ID side-by-side */}
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-emerald-400 font-mono font-bold tracking-wide truncate max-w-[80px]">
                                    {user?.role || "Staff"}
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded tracking-wider" title="Your Login ID">
                                    {user?.username}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded-lg transition-colors"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative w-full">
                <div className="p-8 pb-20 min-h-full">
                    {children}
                </div>
            </main>

        </div>
    );
}