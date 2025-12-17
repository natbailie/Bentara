// src/app/dashboard/upload/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Search, UploadCloud, X, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { PatientService, getFileUrl } from '../../../lib/api';

// Types for our data
interface Patient {
    id: number;
    name: string;
    mrn: string;
    dob: string;
}

interface AnalysisResult {
    diagnosis: string;
    annotated_image: string;
    pdf: string;
    counts: Record<string, number>;
}

export default function UploadPage() {
    // STEP 1: Patient Search State
    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // STEP 2: Upload State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    // Auto-search when typing
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (query.length > 1) {
                try {
                    const res = await PatientService.search(query);
                    setPatients(res.data.patients);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setPatients([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [query]);

    const handleUpload = async () => {
        if (!file || !selectedPatient) return;
        setUploading(true);
        try {
            const res = await PatientService.uploadSample(selectedPatient.id, file);
            setResult(res.data);
        } catch (e) {
            alert("Analysis failed. Please ensure the backend is running.");
        } finally {
            setUploading(false);
        }
    };

    // --- VIEW: RESULTS ---
    if (result) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-8">
                    <div className="flex items-center gap-4 mb-6 text-emerald-600">
                        <CheckCircle size={32} />
                        <h1 className="text-2xl font-bold">Analysis Complete</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Column */}
                        <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
                            <img
                                src={getFileUrl(result.annotated_image)}
                                alt="AI Annotation"
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        {/* Data Column */}
                        <div>
                            <div className="mb-6">
                                <h3 className="text-sm font-bold uppercase text-slate-500 mb-2">AI Impression</h3>
                                <p className="p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 font-medium">
                                    {result.diagnosis}
                                </p>
                            </div>

                            <h4 className="text-sm font-bold uppercase text-slate-500 mb-2">Cell Counts</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-8">
                                {Object.entries(result.counts).map(([key, val]) => (
                                    <div key={key} className="flex justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                        <span className="capitalize text-slate-600">{key}</span>
                                        <span className="font-bold text-slate-900">{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={getFileUrl(result.pdf)}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors font-bold"
                                >
                                    <FileText size={18} /> Download Full PDF Report
                                </a>
                                <button
                                    onClick={() => { setResult(null); setFile(null); }}
                                    className="w-full text-slate-500 py-2 hover:text-slate-800 text-sm"
                                >
                                    Analyze New Sample
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: UPLOAD FORM ---
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Run Analysis</h1>
                <p className="text-slate-500">Select a patient and upload a microscopy image.</p>
            </div>

            {/* STEP 1: SELECT PATIENT */}
            {!selectedPatient ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        1. Identify Patient
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name or MRN..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Search Results */}
                    {patients.length > 0 && (
                        <div className="mt-4 border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {patients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPatient(p)}
                                    className="w-full text-left p-4 hover:bg-blue-50 flex justify-between items-center group transition-colors"
                                >
                                    <div>
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                        <div className="text-xs text-slate-500">MRN: {p.mrn} | DOB: {p.dob}</div>
                                    </div>
                                    <div className="text-blue-600 font-medium text-sm px-3 py-1 bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Select
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {query.length > 1 && patients.length === 0 && (
                        <div className="mt-4 p-4 text-center text-slate-400 text-sm italic">
                            No patients found.
                        </div>
                    )}
                </div>
            ) : (
                /* STEP 2: UPLOAD BOX */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Selected Patient Banner */}
                    <div className="bg-blue-50 p-4 flex justify-between items-center border-b border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold">
                                {selectedPatient.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-blue-900">{selectedPatient.name}</div>
                                <div className="text-xs text-blue-700/70">MRN: {selectedPatient.mrn}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedPatient(null)}
                            className="p-2 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                id="file-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                            />

                            {!file ? (
                                <>
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                        <UploadCloud size={32} />
                                    </div>
                                    <span className="block font-medium text-slate-700">Click or Drag to Upload Image</span>
                                    <span className="block text-sm text-slate-400 mt-2">Supports JPG, PNG</span>
                                </>
                            ) : (
                                <div className="py-4">
                                    <div className="bg-blue-50 inline-block p-3 rounded-lg border border-blue-100 mb-2">
                                        <span className="font-medium text-blue-800">{file.name}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Click to change file</p>
                                </div>
                            )}
                        </div>

                        {/* Run Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                                    !file || uploading
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Processing AI Models...
                                    </>
                                ) : (
                                    'Run Analysis'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}