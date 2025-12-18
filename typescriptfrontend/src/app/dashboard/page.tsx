"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Clock, UploadCloud, UserPlus, Users, Activity,
    ArrowRight, Search, Database, Settings, Siren
} from "lucide-react";
import { DashboardService } from "../../lib/api";

export default function DashboardHome() {
    const router = useRouter();
    const [dateStr, setDateStr] = useState<string>("");
    const [user, setUser] = useState({ name: "Clinician", details: { grade: "", trust: "" } });

    // Stats State
    const [stats, setStats] = useState({ total_patients: 0, pending_reports: 0, critical_alerts: 0 });

    useEffect(() => {
        setDateStr(new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }));

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) {}
        }

        // Load Live Stats
        const loadStats = async () => {
            try {
                const res = await DashboardService.getStats();
                setStats(res.data);
            } catch (e) {
                console.error("Failed to load stats", e);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* 1. TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        {user.details.grade && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">{user.details.grade}</span>}
                        {user.details.trust && <><span className="text-xs">•</span><span>{user.details.trust}</span></>}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
                        <Clock size={16} className="text-blue-600" />
                        <span>{dateStr || "Loading..."}</span>
                    </div>
                    <button onClick={() => router.push('/dashboard/settings')} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* 2. STATS CARDS (LIVE DATA) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: Patients */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden group">
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Patients</p>
                            <h2 className="text-4xl font-bold">{stats.total_patients}</h2>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg"><Users size={20} /></div>
                    </div>
                    <div className="relative z-10 mt-4 text-xs bg-white/10 inline-block px-2 py-1 rounded">Live Database Count</div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Card 2: Pending (Clickable) */}
                <button
                    onClick={() => router.push('/dashboard/pending')}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group hover:border-orange-300"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-orange-600 transition-colors">Pending Reports</p>
                            <h2 className="text-4xl font-bold text-slate-800">{stats.pending_reports}</h2>
                        </div>
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg group-hover:bg-orange-100"><Activity size={20} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${stats.pending_reports > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
                        {stats.pending_reports > 0 ? "Requires Review" : "All Clear"}
                    </p>
                </button>

                {/* Card 3: CRITICAL ALERTS (Replaces AI Accuracy) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Critical Findings</p>
                            <h2 className="text-4xl font-bold text-rose-600">{stats.critical_alerts}</h2>
                        </div>
                        <div className="bg-rose-50 text-rose-600 p-2 rounded-lg animate-pulse"><Siren size={20} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Positive AML / Acute Cases Detected</p>
                </div>
            </div>

            {/* 3. QUICK ACTIONS */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button onClick={() => router.push('/dashboard/upload')} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><UploadCloud size={20} /></div>
                            <h3 className="font-bold text-slate-800">Upload Sample</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Run AI analysis on new microscopy images.</p>
                        <div className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Start Analysis <ArrowRight size={16} /></div>
                    </button>

                    <button onClick={() => router.push('/dashboard/register')} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors"><UserPlus size={20} /></div>
                            <h3 className="font-bold text-slate-800">Register Patient</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Create a new patient record in the system.</p>
                        <div className="text-purple-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">New Record <ArrowRight size={16} /></div>
                    </button>

                    <button onClick={() => router.push('/dashboard/patients')} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Search size={20} /></div>
                            <h3 className="font-bold text-slate-800">Patient Directory</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Search and manage existing patient records.</p>
                        <div className="text-emerald-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Search Records <ArrowRight size={16} /></div>
                    </button>

                    <button onClick={() => router.push('/dashboard/research')} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Database size={20} /></div>
                            <h3 className="font-bold text-slate-800">Research Lab</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Annotate data for model training.</p>
                        <div className="text-indigo-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Open Lab <ArrowRight size={16} /></div>
                    </button>
                </div>
            </div>

        </div>
    );
}