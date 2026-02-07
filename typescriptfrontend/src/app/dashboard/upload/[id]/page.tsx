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
    FileBadge,
    RefreshCw
} from 'lucide-react';
/** * FIXED IMPORT: Uses the centralized API utility.
 * This ensures we are hitting the Cloud URL (not localhost).
 */
import api from '@/lib/api';

export default function PatientUploadPage() {
    // Force params.id to be a string to avoid array issues
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const router = useRouter();

    const [patient, setPatient] = useState<any>(null);
    const [loadingPatient, setLoadingPatient] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [sampleType, setSampleType] = useState("Peripheral Blood Smear");
    const [sampleDate, setSampleDate] = useState(new Date().toISOString().split('T')[0]);
    const [consultantId, setConsultantId] = useState("");
    const [notes, setNotes] = useState("");

    // Submission State
    const [uploading, setUploading] = useState(false);
    const [submissionError, setSubmissionError] = useState("");
    const [successReportId, setSuccessReportId] = useState<number | null>(null);

    // 1. Fetch Patient Details
    const fetchPatient = async () => {
        if (!id) return;

        setLoadingPatient(true);
        setFetchError(null);

        try {
            console.log(`Attempting to fetch patient ID: ${id}`);

            /** * REPLACED: fetch(`http://localhost:8000...`) with api.get
             * This hits your live Hugging Face backend.
             */
            const res = await api.get(`/patients/${id}`);
            setPatient(res.data);
        } catch (err: any) {
            console.error("Error loading patient:", err);
            // Capture specific error code (e.g., 404)
            if (err.response?.status === 404) {
                setFetchError("404: This patient ID does not exist in the live database.");
            } else {
                setFetchError("Connection Failed. The backend might be sleeping.");
            }
        } finally {
            setLoadingPatient(false);
        }
    };

    useEffect(() => {
        fetchPatient();
    }, [id]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !patient) return;

        setUploading(true);
        setSubmissionError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("patient_id", patient.id);
            formData.append("sample_type", sampleType);
            formData.append("sample_date", sampleDate);
            if (consultantId) formData.append("assigned_to_id", consultantId);
            formData.append("notes", notes);

            // Use api.post for automatic Auth headers and Cloud URL
            const res = await api.post('/upload', formData);

            setSuccessReportId(res.data.report_id);

        } catch (err: any) {
            console.error("Upload error:", err);
            const serverMsg = err.response?.data?.detail;
            setSubmissionError(typeof serverMsg === 'string' ? serverMsg : "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    // --- LOADING VIEW ---
    if (loadingPatient) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p>Retrieving patient record...</p>
            </div>
        );
    }

    // --- ERROR VIEW (The "Not Found" Fix) ---
    if (fetchError || !patient) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-sm text-black">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Not Found</h2>
                <p className="text-slate-500 mb-6">
                    {fetchError || "The requested patient ID could not be retrieved."}
                </p>
                <div className="p-4 bg-slate-50 rounded-xl mb-6 text-sm text-left">
                    <p className="font-bold text-slate-700 mb-1">Why is this happening?</p>
                    <ul className="list-disc list-inside text-slate-500 space-y-1">
                        <li>The backend database may have restarted and wiped its data.</li>
                        <li>Your "Search" list might be showing cached (old) patients.</li>
                        <li>The ID <strong>{id}</strong> no longer exists in the system.</li>
                    </ul>
                </div>
                <div className="flex justify-center gap-4">
                    <button onClick={() => router.push('/dashboard/register')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        Register New Patient
                    </button>
                    <button onClick={fetchPatient} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    // --- SUCCESS VIEW ---
    if (successReportId) {
        return (
            <div className="max-w-xl mx-auto text-center pt-10 animate-in zoom-in duration-300 text-black">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis Complete</h1>
                <p className="text-slate-500 mb-8">The report has been generated and sent to the consultant&apos;s queue.</p>

                <div className="grid grid-cols-1 gap-4">
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
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 text-black">

            <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">New Analysis</h1>
                    <p className="text-slate-500 mt-1">Upload sample for <span className="font-bold text-blue-600">{patient.name}</span></p>
                </div>
                <button onClick={() => router.back()} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <ArrowLeft size={16} /> Cancel
                </button>
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
                                className="w-full pl-10 p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                                placeholder="Enter Consultant's 6-Digit ID or Login Name"
                                value={consultantId} onChange={e => setConsultantId(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400">The report will appear in this consultant&apos;s &quot;Pending Reviews&quot; queue.</p>
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

                    {submissionError && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-bold"><AlertCircle/> {submissionError}</div>}

                    <button disabled={!file || uploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                        {uploading ? "Analyzing..." : "Run Analysis & Generate Report"}
                    </button>
                </form>
            </div>
        </div>
    );
}