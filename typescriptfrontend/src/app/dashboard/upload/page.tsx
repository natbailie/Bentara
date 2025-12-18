"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    UploadCloud, Search, FileText, AlertCircle, CheckCircle,
    Loader2, ArrowRight, ExternalLink, UserCheck
} from 'lucide-react';
import api, { getFileUrl, UserService } from '../../../lib/api';

interface Patient { id: number; name: string; mrn: string; }
interface Consultant { username: string; full_name: string; }
interface AnalysisResult { diagnosis: string; confidence: string; annotated_image: string; pdf: string; counts: Record<string, number>; }

export default function UploadPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);

    // NEW: Consultant Assignment
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [assignedTo, setAssignedTo] = useState("");

    useEffect(() => {
        // Load list of consultants for dropdown
        UserService.getConsultants().then(res => setConsultants(res.data)).catch(console.error);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            const res = await api.get(`/patients/search?query=${searchQuery}`);
            setSearchResults(res.data.patients);
        } catch (err) { setError("Could not search patients."); }
    };

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setStep(2);
        setSearchResults([]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !selectedPatient) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('patient_id', selectedPatient.id.toString());
            formData.append('file', file);
            // Send Assignment
            formData.append('assigned_to', assignedTo);

            const response = await api.post('/upload', formData);
            setResult(response.data);
            setStep(3);
        } catch (err: any) {
            setError(`Server Error: ${err.response?.data?.detail || err.message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">New Analysis</h1>
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle size={20}/> {error}</div>}

            {/* STEP 1: PATIENT */}
            {step === 1 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Select Patient</h2>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Name or MRN..." className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700">Search</button>
                    </form>
                    <div className="space-y-2">
                        {searchResults.map(p => (
                            <button key={p.id} onClick={() => selectPatient(p)} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 flex justify-between items-center group">
                                <div><p className="font-bold text-slate-900">{p.name}</p><p className="text-sm text-slate-500">MRN: {p.mrn}</p></div>
                                <span className="text-blue-600 font-bold text-sm bg-white px-3 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100">Select</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: UPLOAD & ASSIGN */}
            {step === 2 && selectedPatient && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">{selectedPatient.name.charAt(0)}</div>
                            <div><p className="font-bold text-sm">{selectedPatient.name}</p><p className="text-xs text-blue-100">MRN: {selectedPatient.mrn}</p></div>
                        </div>
                        <button onClick={() => setStep(1)} className="text-xs bg-white/10 px-3 py-1 rounded">Change</button>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* ASSIGNMENT DROPDOWN */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign to Consultant for Review (Optional)</label>
                            <div className="relative">
                                <UserCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full pl-10 p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                                >
                                    <option value="">-- No Specific Consultant --</option>
                                    {consultants.map(c => (
                                        <option key={c.username} value={c.username}>{c.full_name} ({c.username})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-all relative">
                            <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {file ? <div className="text-emerald-600"><CheckCircle size={40} className="mx-auto mb-2"/><p className="font-bold">{file.name}</p></div> : <div className="text-slate-400"><UploadCloud size={40} className="mx-auto mb-2"/><p>Click to Upload Image</p></div>}
                        </div>

                        <button onClick={handleUpload} disabled={!file || loading} className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 ${!file || loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}>
                            {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : "Run Analysis"}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 3 && result && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-600 p-6 text-white text-center">
                        <CheckCircle size={32} className="mx-auto mb-2"/>
                        <h2 className="text-2xl font-bold">Analysis Complete</h2>
                        {assignedTo && <p className="text-emerald-100 text-sm mt-1">Assigned to {assignedTo} for review</p>}
                    </div>
                    <div className="p-8">
                        <div className="flex gap-4 items-center mb-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0"><img src={getFileUrl(result.annotated_image)} className="w-full h-full object-cover" /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{result.diagnosis}</h3>
                                <p className="text-slate-500">Confidence: <span className="text-emerald-600 font-bold">{result.confidence}</span></p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <a href={getFileUrl(result.pdf)} target="_blank" className="bg-blue-600 text-white py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-blue-700"><FileText size={18}/> PDF Report</a>
                            <button onClick={() => router.push(`/dashboard/patients/${selectedPatient?.id}`)} className="border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-center hover:bg-slate-50">Patient Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}