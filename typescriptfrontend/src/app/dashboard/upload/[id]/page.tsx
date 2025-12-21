"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    UploadCloud,
    CheckCircle,
    Loader2,
    AlertCircle,
    ArrowLeft,
    Calendar,
    TestTube,
    UserCheck,
    FileBadge
} from 'lucide-react';

export default function PatientUploadPage() {
    const params = useParams();
    const router = useRouter();

    const [patient, setPatient] = useState<any>(null);
    const [loadingPatient, setLoadingPatient] = useState(true);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [sampleType, setSampleType] = useState("Peripheral Blood Smear");
    const [sampleDate, setSampleDate] = useState(new Date().toISOString().split('T')[0]);
    const [consultantId, setConsultantId] = useState("");
    const [notes, setNotes] = useState("");

    // Submission State
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [successReportId, setSuccessReportId] = useState<number | null>(null);

    useEffect(() => {
        fetch(`http://localhost:8000/patients/${params.id}`)
            .then(res => res.json())
            .then(data => { setPatient(data); setLoadingPatient(false); })
            .catch(() => setLoadingPatient(false));
    }, [params.id]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !patient) return;

        setUploading(true);
        setError("");

        try {
            const token = localStorage.getItem("access_token");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("patient_id", patient.id);
            formData.append("sample_type", sampleType);
            formData.append("sample_date", sampleDate);
            formData.append("assigned_to_id", consultantId);
            formData.append("notes", notes);

            const res = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Upload failed");

            // SUCCESS: Show success screen
            setSuccessReportId(data.report_id);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loadingPatient) return <div className="p-10 text-center text-slate-400">Loading...</div>;

    // --- SUCCESS VIEW ---
    if (successReportId) {
        return (
            <div className="max-w-xl mx-auto text-center pt-10 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis Complete</h1>
                <p className="text-slate-500 mb-8">The report has been generated and sent to the consultant's queue.</p>

                <div className="grid grid-cols-1 gap-4">
                    {/* UPDATED LINK: Removed target="_blank" so it opens in the same tab */}
                    <Link
                        href={`/dashboard/report/${successReportId}`}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <FileBadge size={20} /> View & Print Report
                    </Link>
                    <Link
                        href="/dashboard/reviews"
                        className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">

            <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">New Analysis</h1>
                    <p className="text-slate-500 mt-1">Upload sample for <span className="font-bold text-blue-600">{patient.name}</span></p>
                </div>
                <button onClick={() => router.back()} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
                <form onSubmit={handleUpload} className="space-y-8">

                    {/* ROW 1: SAMPLE DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sample Type</label>
                            <div className="relative">
                                <TestTube className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                                    value={sampleType} onChange={e => setSampleType(e.target.value)}
                                >
                                    <option>Peripheral Blood Smear</option>
                                    <option>Bone Marrow Aspirate</option>
                                    <option>Lymph Node Biopsy</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input type="date" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                                       value={sampleDate} onChange={e => setSampleDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: CONSULTANT ASSIGNMENT */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Assign to Consultant</label>
                        <div className="relative">
                            <UserCheck className="absolute left-3 top-3 text-blue-400" size={18} />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                                placeholder="Enter Consultant's 6-Digit ID or Login Name"
                                value={consultantId} onChange={e => setConsultantId(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400">The report will appear in this consultant's "Pending Reviews" queue.</p>
                    </div>

                    {/* ROW 3: FILE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slide Image</label>
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-blue-400'}`}>
                            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                {file ? (
                                    <div className="text-emerald-700 font-bold flex flex-col items-center">
                                        <CheckCircle className="mb-2"/> {file.name}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 flex flex-col items-center">
                                        <UploadCloud size={32} className="mb-2"/> Click to Upload Slide
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-bold"><AlertCircle/> {error}</div>}

                    <button disabled={!file || uploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                        {uploading ? "Analyzing..." : "Run Analysis & Generate Report"}
                    </button>
                </form>
            </div>
        </div>
    );
}