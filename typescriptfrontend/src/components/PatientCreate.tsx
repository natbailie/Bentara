"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // <--- Changed from react-router-dom
import { PatientService } from '../lib/api'; // <--- Ensure this points to lib/api

export default function PatientCreate() {
    const router = useRouter(); // <--- Next.js router
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
            // Calls the API to create patient
            const res = await PatientService.create(formData);
            // Redirect to the dashboard list on success
            router.push('/dashboard/patients');
        } catch (error) {
            alert("Error creating patient. Please check the console.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Register New Patient</h2>
                <p className="text-slate-500 text-sm">Enter demographics and sample details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Width Name */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input required name="name" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                </div>

                {/* IDs */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">MRN (Hospital ID)</label>
                    <input name="mrn" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">NHS Number</label>
                    <input name="nhs_number" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                {/* Demographics */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input type="date" name="dob" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Sex</label>
                    <select name="sex" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>

                {/* Clinical Info */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Clinician</label>
                    <input name="clinician" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ward / Location</label>
                    <input name="ward" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                {/* Sample Details */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Stain Type</label>
                    <select name="stain" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Giemsa</option>
                        <option>Wright-Giemsa</option>
                        <option>H&E</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Zoom Level</label>
                    <select name="zoom" onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>40x</option>
                        <option>100x</option>
                        <option>10x</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Sample Date</label>
                    <input type="date" name="sample_date" value={formData.sample_date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Indication / Notes</label>
                    <textarea name="indication" rows={3} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-md"
                    >
                        {loading ? 'Registering...' : 'Create Patient Record'}
                    </button>
                </div>
            </form>
        </div>
    );
}