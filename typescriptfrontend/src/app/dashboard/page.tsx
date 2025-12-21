"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    UserPlus,
    UploadCloud,
    Database,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
    const [stats, setStats] = useState({ total_patients: 0, pending_reports: 0, critical_alerts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. SAFELY Load User Info
        const storedUser = localStorage.getItem("user_details");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Corrupted dashboard user data");
                // If data is bad, we don't crash, we just ignore it
                localStorage.removeItem("user_details");
            }
        }

        // 2. Fetch Dashboard Stats
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/dashboard/stats');
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error("Stats error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome, {user?.full_name || 'Doctor'}
                    </h1>
                    <p className="text-slate-500 mt-1">Select an action to get started.</p>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</span>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                        Online & Connected
                    </div>
                </div>
            </div>

            {/* QUICK STATS ROW */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row justify-around items-center gap-8 shadow-2xl">

                {/* LINKED: Pending Reviews Card */}
                <Link href="/dashboard/reviews" className="text-center group cursor-pointer">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">Pending Reviews</p>
                    <p className="text-4xl font-bold text-blue-400 group-hover:scale-110 transition-transform">{loading ? '-' : stats.pending_reports}</p>
                </Link>

                <div className="w-px h-12 bg-slate-700 hidden md:block"></div>

                <div className="text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Patients</p>
                    <p className="text-4xl font-bold text-white">{loading ? '-' : stats.total_patients}</p>
                </div>

                <div className="w-px h-12 bg-slate-700 hidden md:block"></div>

                <div className="text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Critical Alerts</p>
                    <p className="text-4xl font-bold text-red-500">{loading ? '-' : stats.critical_alerts}</p>
                </div>
            </div>

            {/* --- NAVIGATION OPTIONS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* OPTION 1: REGISTER */}
                <Link href="/dashboard/register" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <UserPlus size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Register Patient</h3>
                        <p className="text-sm text-slate-500 mb-4">Create a new patient record.</p>
                        <span className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start <ArrowRight size={16}/>
                </span>
                    </div>
                </Link>

                {/* OPTION 2: UPLOAD */}
                <Link href="/dashboard/upload" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <UploadCloud size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Sample</h3>
                        <p className="text-sm text-slate-500 mb-4">Run AI diagnostics on slides.</p>
                        <span className="text-indigo-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Upload <ArrowRight size={16}/>
                </span>
                    </div>
                </Link>

                {/* OPTION 3: DIRECTORY */}
                <Link href="/dashboard/patients" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Patient Directory</h3>
                        <p className="text-sm text-slate-500 mb-4">View {stats.total_patients} registered records.</p>
                        <span className="text-emerald-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Browse <ArrowRight size={16}/>
                </span>
                    </div>
                </Link>

                {/* OPTION 4: RESEARCH */}
                <Link href="/dashboard/research" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Database size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Research Lab</h3>
                        <p className="text-sm text-slate-500 mb-4">Contribute to the training dataset.</p>
                        <span className="text-purple-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Access <ArrowRight size={16}/>
                </span>
                    </div>
                </Link>

            </div>

        </div>
    );
}