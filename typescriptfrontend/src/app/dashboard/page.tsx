// src/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { UserPlus, Search, Microscope, ArrowRight, FileText } from "lucide-react";

export default function DashboardHome() {
    return (
        <div className="mx-auto max-w-6xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="mt-1 text-slate-500">Welcome to the Bentara Pathology Intelligence Unit.</p>
            </header>

            {/* Stats Row */}
            <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Patients", value: "1,248", color: "text-blue-600" },
                    { label: "Samples Today", value: "12", color: "text-emerald-600" },
                    { label: "Pending Review", value: "3", color: "text-orange-500" },
                    { label: "Reports Generated", value: "85", color: "text-purple-600" },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium uppercase text-slate-400">{stat.label}</div>
                        <div className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <h2 className="mb-6 text-xl font-semibold text-slate-800">Quick Actions</h2>

            {/* Action Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                {/* Card 1: Register */}
                <Link href="/dashboard/register" className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <UserPlus size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">New Patient</h3>
                    <p className="mt-2 mb-8 text-sm text-slate-500">Register a new patient record into the system.</p>
                    <div className="absolute bottom-6 left-6 flex items-center text-sm font-bold text-blue-600">
                        Start Registration <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                {/* Card 2: Directory */}
                <Link href="/dashboard/patients" className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                        <Search size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Patient Directory</h3>
                    <p className="mt-2 mb-8 text-sm text-slate-500">Search and manage existing patient records.</p>
                    <div className="absolute bottom-6 left-6 flex items-center text-sm font-bold text-purple-600">
                        Search Database <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                {/* Card 3: Upload */}
                <Link href="/dashboard/upload" className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                        <Microscope size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Run Analysis</h3>
                    <p className="mt-2 mb-8 text-sm text-slate-500">Upload a blood sample image for AI detection.</p>
                    <div className="absolute bottom-6 left-6 flex items-center text-sm font-bold text-emerald-600">
                        Upload Sample <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

            </div>
        </div>
    );
}