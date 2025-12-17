// src/app/dashboard/patients/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, User, FileText, Loader2 } from 'lucide-react';
import { PatientService } from '../../../lib/api';

// Minimal Type definition for the list view
interface Patient {
    id: number;
    name: string;
    mrn?: string;
    dob?: string;
    clinician?: string;
    ward?: string;
}

export default function PatientDirectory() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Load all patients on startup
    useEffect(() => {
        fetchPatients();
    }, []);

    // Search effect (debounced slightly or direct)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchPatients = async (q: string = "") => {
        try {
            // Your backend search handles empty strings as "return all"
            const res = await PatientService.search(q);
            setPatients(res.data.patients);
        } catch (e) {
            console.error("Failed to load patients", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Patient Directory</h1>
                    <p className="text-slate-500">Search and manage patient records.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search name, MRN, or NHS number..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Name / ID</th>
                        <th className="px-6 py-4">DOB</th>
                        <th className="px-6 py-4">Clinician</th>
                        <th className="px-6 py-4">Ward</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin" /> Loading records...
                                </div>
                            </td>
                        </tr>
                    ) : patients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No patients found matching "{query}"
                            </td>
                        </tr>
                    ) : (
                        patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-blue-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{patient.name}</div>
                                            <div className="text-xs text-slate-500">MRN: {patient.mrn}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {patient.dob || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {patient.clinician || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {patient.ward || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {/* Note: This links to the detail page. You will need to create src/app/patients/[id]/page.tsx later */}
                                    <Link
                                        href={`/patients/${patient.id}`}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        View Chart <FileText size={16} />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}