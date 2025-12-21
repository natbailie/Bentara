"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search,
    Filter,
    MoreVertical,
    FileText,
    Plus,
    Loader2,
    RefreshCw
} from 'lucide-react';

export default function PatientDirectory() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/patients');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setPatients(data);
        } catch (err) {
            console.error("Error fetching patients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // Helper to convert YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const parts = dateString.split('-'); // Split 2025-12-21
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`; // Return 21/12/2025
        }
        return dateString;
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Patient Directory</h1>
                    <p className="text-slate-500 mt-1">Manage patient records and histories.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchPatients}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Link
                        href="/dashboard/register"
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Patient
                    </Link>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-center">
                <Search className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by Name or MRN..."
                    className="flex-1 outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="w-px h-6 bg-slate-200"></div>
                <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm">
                    <Filter size={16} /> Filters
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Patient Name</th>
                        <th className="p-4">MRN</th>
                        <th className="p-4">Date of Birth</th>
                        <th className="p-4">Gender</th>
                        <th className="p-4">NHS Number</th>
                        <th className="p-4 text-right pr-6"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">

                    {loading ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin" /> Loading Records...
                                </div>
                            </td>
                        </tr>
                    ) : filteredPatients.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">
                                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No patients found.</p>
                            </td>
                        </tr>
                    ) : (
                        filteredPatients.map((patient) => (
                            <tr
                                key={patient.id}
                                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                                <td className="p-4 pl-6 font-bold text-slate-900">{patient.name}</td>
                                <td className="p-4 font-mono text-slate-600">
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-bold">{patient.mrn}</span>
                                </td>

                                {/* UPDATED: Uses formatDate function */}
                                <td className="p-4 text-slate-600">{formatDate(patient.dob)}</td>

                                <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            patient.gender === 'Male' ? 'bg-blue-50 text-blue-600' :
                                patient.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {patient.gender}
                        </span>
                                </td>
                                <td className="p-4 text-slate-600 text-sm font-mono tracking-wide">
                                    {patient.nhs_number || "N/A"}
                                </td>

                                <td className="p-4 text-right pr-6">
                                    <MoreVertical size={20} className="text-slate-300 group-hover:text-slate-600" />
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