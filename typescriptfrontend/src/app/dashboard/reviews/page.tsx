"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, ArrowRight, Loader2, AlertCircle, FileText } from 'lucide-react';

export default function ReviewsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // 1. Get the token (Proof of who you are)
                const token = localStorage.getItem("access_token");

                if (!token) {
                    setError("You are not logged in.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch reports with Authorization header
                const res = await fetch('http://localhost:8000/reports/pending', {
                    headers: {
                        'Authorization': `Bearer ${token}`  // <--- THIS IS THE KEY
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setReports(data);
                } else {
                    if (res.status === 401) setError("Session expired. Please login again.");
                    else setError("Failed to load your task list.");
                }
            } catch (err) {
                console.error(err);
                setError("Network error. Could not connect to server.");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[60vh]">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading your assigned cases...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
                <AlertCircle /> {error}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500">

            <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Clock size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Pending Reviews</h1>
                    <p className="text-slate-500">Diagnostic reports specifically assigned to you for authorization.</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">All Caught Up!</h2>
                    <p className="text-slate-500 mt-2 max-w-md">
                        You have no pending reports in your queue. New assignments will appear here automatically.
                    </p>
                    <div className="mt-8">
                        <Link href="/dashboard" className="text-blue-600 font-bold hover:underline flex items-center gap-2">
                            Return to Dashboard <ArrowRight size={16}/>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:border-blue-300 transition-all group hover:shadow-md">

                            {/* Thumbnail */}
                            <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                                <img
                                    src={`http://localhost:8000${report.image_url}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    alt="Slide Sample"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                                    <h3 className="text-lg font-bold text-slate-900">{report.patient_name}</h3>
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">
                                {report.patient_mrn}
                            </span>
                                </div>

                                <div className="flex flex-col md:flex-row gap-x-6 gap-y-1 text-sm text-slate-600 mb-3 justify-center md:justify-start">
                             <span className="flex items-center gap-2 justify-center md:justify-start">
                                 <FileText size={14} className="text-slate-400"/>
                                 Type: <strong className="text-slate-900">{report.sample_type}</strong>
                             </span>
                                    <span className="flex items-center gap-2 justify-center md:justify-start">
                                 <AlertCircle size={14} className="text-blue-400"/>
                                 AI Finding: <strong className="text-blue-600">{report.diagnosis}</strong>
                                 <span className="text-slate-400">({report.confidence})</span>
                             </span>
                                </div>

                                <p className="text-xs text-slate-400 font-mono">Submitted: {report.date}</p>
                            </div>

                            {/* Action */}
                            <Link
                                href={`/dashboard/report/${report.id}`}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 shrink-0 transition-transform active:scale-95"
                            >
                                Review Now <ArrowRight size={18} />
                            </Link>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}