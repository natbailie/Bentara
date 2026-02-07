"use client";

import { useState } from 'react';
import { Save, XCircle, CheckCircle, Loader2, User, Calendar, FileText, Hash, AlertCircle, Activity } from 'lucide-react';
import api from '../../../lib/api'; //

export default function RegisterPatientPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "", mrn: "", nhs_number: "", dob: "", gender: "Male", history: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!/^\d{10}$/.test(formData.nhs_number.replace(/\s/g, ''))) {
            setError("Invalid NHS Number: Must be exactly 10 digits.");
            setLoading(false);
            return;
        }

        try {
            // Changed from fetch(localhost) to api.post
            await api.post('/patients/register', formData);
            setSuccess(true);
            setFormData({ name: "", mrn: "", nhs_number: "", dob: "", gender: "Male", history: "" });
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to register patient.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-900">Register New Patient</h1>
                <p className="text-slate-500 mt-1">Create a secure clinical record. All mandatory fields (*) must be completed.</p>
            </div>

            {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3"><CheckCircle size={24} /><div><p className="font-bold">Patient Registered Successfully!</p></div></div>}
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3"><AlertCircle size={24} /><p className="font-bold">{error}</p></div>}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Full Name <span className="text-red-500">*</span></label>
                        <div className="relative"><User className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" placeholder="Last Name, First Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">MRN (Hospital ID) <span className="text-red-500">*</span></label>
                        <div className="relative"><Hash className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900" placeholder="e.g. MRN-88219" value={formData.mrn} onChange={(e) => setFormData({...formData, mrn: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">NHS Number <span className="text-red-500">*</span></label>
                        <div className="relative"><Activity className="absolute left-3 top-3 text-blue-400" size={18} /><input type="text" required maxLength={10} className="w-full pl-10 p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900" placeholder="10 Digits" value={formData.nhs_number} onChange={(e) => setFormData({...formData, nhs_number: e.target.value.replace(/\D/g, '')})} /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth <span className="text-red-500">*</span></label>
                        <div className="relative"><Calendar className="absolute left-3 top-3 text-slate-400" size={18} /><input type="date" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender <span className="text-red-500">*</span></label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                    <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical History / Relevant Notes</label><div className="relative"><FileText className="absolute left-3 top-3 text-slate-400" size={18} /><textarea rows={4} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none" placeholder="Contextual notes..." value={formData.history} onChange={(e) => setFormData({...formData, history: e.target.value})} /></div></div>
                </div>
                <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
                    <button type="button" onClick={() => setFormData({name:"", mrn:"", nhs_number: "", dob:"", gender:"Male", history:""})} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"><XCircle size={20} /> Clear</button>
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">{loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}Save Patient Record</button>
                </div>
            </form>
        </div>
    );
}