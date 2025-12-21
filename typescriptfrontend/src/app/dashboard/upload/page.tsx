"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, ArrowRight, Loader2 } from 'lucide-react';

export default function UploadSearchPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch Patients on Load
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await fetch('http://localhost:8000/patients');
                if (res.ok) {
                    const data = await res.json();
                    setPatients(data);
                }
            } catch (err) {
                console.error("Failed to load patients list");
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    // Filter Logic
    const filteredPatients = patients.filter(p =>
            searchTerm && (
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900">Select Patient</h1>
                <p className="text-slate-500 mt-2">Who is this sample for? Search by Name or MRN.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg text-slate-900 transition-all placeholder:font-normal"
                        placeholder="Start typing to search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* RESULTS LIST */}
                <div className="mt-4 space-y-2">
                    {loading && (
                        <div className="text-center py-4 text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={16} /> Loading directory...
                        </div>
                    )}

                    {!loading && searchTerm && filteredPatients.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p>No patients found matching "{searchTerm}"</p>
                            <button onClick={() => router.push('/dashboard/register')} className="text-blue-600 font-bold hover:underline mt-2">
                                Register New Patient?
                            </button>
                        </div>
                    )}

                    {filteredPatients.map(p => (
                        <button
                            key={p.id}
                            onClick={() => router.push(`/dashboard/upload/${p.id}`)}
                            className="w-full text-left p-4 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl flex justify-between items-center group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">MRN: {p.mrn}</p>
                                </div>
                            </div>
                            <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={20} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}