"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, ShieldAlert, X, UserCheck, Filter, AlertCircle } from "lucide-react";
import { DashboardService, PatientService, getFileUrl } from "../../../lib/api";

export default function PendingReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // User State
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState<string>("");

    // Filter State
    const [showAll, setShowAll] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{show: boolean, reportId: number | null}>({ show: false, reportId: null });

    useEffect(() => {
        // 1. Get Full User Details (for display names)
        const u = localStorage.getItem("user");
        if (u) setUser(JSON.parse(u));

        // 2. Get Username/Token (for ID matching)
        // In our simple auth, the token IS the username
        const token = localStorage.getItem("token");
        if (token) setUsername(token);

        // 3. Load Data
        loadData(token || "");
    }, [showAll]); // Reload if toggle changes

    const loadData = async (currentUsername: string) => {
        setLoading(true);
        try {
            const res = await DashboardService.getPendingReports();
            const allReports = res.data;

            if (showAll) {
                // Show EVERYTHING (Safety net for demos)
                setReports(allReports);
            } else {
                // FILTER LOGIC:
                // Show if:
                // 1. Report is unassigned (free for anyone)
                // 2. Report is assigned explicitly to ME (username match)
                const filtered = allReports.filter((r: any) => {
                    if (!r.assigned_to) return true;
                    return r.assigned_to === currentUsername;
                });
                setReports(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOffClick = (reportId: number) => {
        setConfirmModal({ show: true, reportId });
    };

    const confirmSignOff = async () => {
        if (!confirmModal.reportId || !user) return;

        try {
            // We sign off using the Display Name (Dr Smith) for the PDF record
            await PatientService.signOff(confirmModal.reportId, user.name);
            setConfirmModal({ show: false, reportId: null });
            loadData(username); // Refresh list
        } catch (e) {
            alert("Error signing off");
        }
    };

    if (loading && reports.length === 0) return <div className="p-8 text-center text-slate-400">Loading Pending Queue...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Pending Sign-Off</h1>
                        <p className="text-slate-500">
                            {showAll ? "Viewing ALL pending reports." : `Reports assigned to you (${username}).`}
                        </p>
                    </div>
                </div>

                {/* TOGGLE BUTTON: "My Reports" vs "All Reports" */}
                <button
                    onClick={() => setShowAll(!showAll)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        showAll
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                >
                    <Filter size={16} />
                    {showAll ? "Showing All Reports" : "Filter: Assigned to Me"}
                </button>
            </div>

            {reports.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
                    {showAll ? (
                        <>
                            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
                            <p className="text-lg font-medium text-slate-600">All Caught Up!</p>
                            <p className="text-sm">No pending reports found in the entire system.</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                            <p className="text-lg font-medium text-slate-600">No Assignments</p>
                            <p className="text-sm mb-4">You have no specific reports assigned to you.</p>
                            <button onClick={() => setShowAll(true)} className="text-blue-600 font-bold hover:underline">
                                View All System Reports
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {reports.map(r => (
                        <div key={r.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-blue-200 transition-colors">

                            {/* Thumbnail */}
                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                <img src={getFileUrl(r.annotated_image)} className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold font-mono">
                                  {r.patient_mrn}
                              </span>
                                    {r.assigned_to === username ? (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                      <UserCheck size={10} /> Assigned to Me
                                  </span>
                                    ) : r.assigned_to ? (
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">
                                      For: {r.assigned_to}
                                  </span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                                      Unassigned
                                  </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{r.patient_name}</h3>
                                <p className="text-slate-500 text-sm flex items-center justify-center md:justify-start gap-2">
                                    <Clock size={14} /> Created: {r.date}
                                </p>
                                <p className="font-bold text-slate-800 mt-2">{r.diagnosis} <span className="text-slate-400 font-normal text-xs">({r.confidence})</span></p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push(`/dashboard/patients/${r.patient_id}`)}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 px-4 py-2"
                                >
                                    View Chart
                                </button>
                                <button
                                    onClick={() => handleSignOffClick(r.id)}
                                    className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-900/20 flex items-center gap-2"
                                >
                                    <UserCheck size={18} /> Review & Sign Off
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => setConfirmModal({show: false, reportId: null})}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Authorize Report?</h2>
                            <p className="text-slate-500 mt-2">
                                You are about to digitally sign report <span className="font-mono font-bold">#{confirmModal.reportId}</span> as <span className="font-bold text-slate-800">{user?.name}</span>.
                            </p>
                            <p className="text-xs text-amber-600 font-bold mt-4 bg-amber-50 py-2 rounded-lg">
                                This action becomes part of the permanent medical record.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmModal({show: false, reportId: null})}
                                className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSignOff}
                                className="flex-1 py-3 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-900/20 transition-colors"
                            >
                                Confirm Signature
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}