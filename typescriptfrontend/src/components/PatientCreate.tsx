"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Calendar,
    Hash,
    Stethoscope,
    Microscope,
    Save,
    Loader2
} from 'lucide-react';
import { PatientService } from '../lib/api';

export default function PatientCreate() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        sex: 'Male',
        mrn: '',
        nhs_number: '',
        clinician: '',
        ward: '',
        sample_date: new Date().toISOString().split('T')[0],
        indication: '',
        stain: 'Giemsa',
        zoom: '40x'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await PatientService.create(formData);
            router.push('/dashboard/patients');
        } catch (error) {
            alert("Error creating patient. Please check the backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">

            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New Registration</h1>
                    <p className="text-slate-500">Create a patient record and log initial sample details.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMN 1: PATIENT DEMOGRAPHICS (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <User className="text-blue-600" size={20} />
                            <h3 className="font-bold text-slate-800">Patient Demographics</h3>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                                <input required name="name" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Patient name" />
                            </div>

                            {/* IDs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Hash size={12}/> MRN / Hospital ID</label>
                                <input name="mrn" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="MRN-..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">NHS Number</label>
                                <input name="nhs_number" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>

                            {/* DOB & Sex */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Calendar size={12}/> Date of Birth</label>
                                <input type="date" name="dob" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Biological Sex</label>
                                <div className="relative">
                                    <select name="sex" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all">
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinical Context */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Stethoscope className="text-emerald-600" size={20} />
                            <h3 className="font-bold text-slate-800">Clinical Context</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Requesting Clinician</label>
                                <input name="clinician" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Dr " />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ward / Location</label>
                                <input name="ward" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Indication</label>
                                <textarea name="indication" rows={2} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Symptoms, queries, or history..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: LAB DETAILS (1/3 width - Sticky) */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                            <Microscope className="text-blue-400" size={20} />
                            <h3 className="font-bold">Lab Sample</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Sample Date</label>
                                <input type="date" name="sample_date" value={formData.sample_date} onChange={handleChange} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Stain Type</label>
                                <select name="stain" onChange={handleChange} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option>Giemsa</option>
                                    <option>Wright-Giemsa</option>
                                    <option>H&E</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Magnification</label>
                                <select name="zoom" onChange={handleChange} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option>40x</option>
                                    <option>100x</option>
                                    <option>10x</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-900/50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    {loading ? 'Saving...' : 'Register Patient'}
                                </button>
                                <p className="text-[10px] text-slate-500 mt-3 text-center">
                                    Clicking register will create a permanent MRN record.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}