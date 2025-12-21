"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// REMOVED: Microscope icon is no longer needed
// CHANGED: Replaced BadgeId with IdCard below
import { Loader2, CheckCircle, ShieldAlert, ArrowRight, IdCard, Building } from 'lucide-react';

export default function UserRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [successData, setSuccessData] = useState<{ username: string } | null>(null);

    // Field Logic State
    const [isPhysician, setIsPhysician] = useState(true);

    const [formData, setFormData] = useState({
        title: "Dr",
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Consultant", // Default
        license_id: ""
    });

    // Update "Physician" status whenever Role changes
    useEffect(() => {
        // List of roles that do NOT need a GMC number
        const nonPhysicianRoles = ["Lab Technician", "Biomedical Scientist", "Researcher", "Admin / Secretary", "Student"];
        const isDoc = !nonPhysicianRoles.includes(formData.role);
        setIsPhysician(isDoc);

        // Clear the license field when switching modes to avoid confusion
        setFormData(prev => ({ ...prev, license_id: "" }));
    }, [formData.role]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError("");

        // --- 1. STRICT VALIDATION ---

        // Password Length (Increased to 8)
        if (formData.password.length < 8) {
            setGlobalError("Security Alert: Password must be at least 8 characters long.");
            setLoading(false);
            return;
        }

        // Password Match
        if (formData.password !== formData.confirmPassword) {
            setGlobalError("Security Alert: Passwords do not match.");
            setLoading(false);
            return;
        }

        // GMC Number Validation (Only if Physician)
        if (isPhysician) {
            // Regex: Exactly 7 digits
            const gmcRegex = /^\d{7}$/;
            if (!gmcRegex.test(formData.license_id)) {
                setGlobalError("Invalid GMC Number: Must be exactly 7 digits.");
                setLoading(false);
                return;
            }
        } else {
            // Employee ID Validation (Must not be empty)
            if (formData.license_id.length < 3) {
                setGlobalError("Invalid ID: Employee/Trust ID is required.");
                setLoading(false);
                return;
            }
        }

        // --- 2. PREPARE DATA ---

        // Combine Title + Name for storage (e.g. "Dr. John Smith")
        const finalName = `${formData.title} ${formData.full_name}`.trim();

        // Generate Username: "smi" + "829"
        const namePart = formData.full_name.replace(/\s/g, '').substring(0, 3).toLowerCase();
        const randomPart = Math.floor(100 + Math.random() * 900);
        const generatedUsername = `${namePart}${randomPart}`;

        try {
            const res = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: generatedUsername,
                    email: formData.email,
                    password: formData.password,
                    full_name: finalName, // Sending combined name
                    role: formData.role,
                    license_id: formData.license_id
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Registration failed. Please try again.");
            }

            setSuccessData({ username: generatedUsername });

        } catch (err: any) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
                    <p className="text-slate-500 mb-6">Your account has been created.</p>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Login ID</p>
                        <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">{successData.username}</p>
                        <p className="text-xs text-slate-400 mt-2">Please save this ID to log in.</p>
                    </div>

                    <Link href="/" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                        Proceed to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">

                {/* Left: Info Panel */}
                <div className="bg-slate-900 p-10 md:w-2/5 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* --- LOGO SECTION UPDATED --- */}
                        <div className="flex flex-col items-center gap-6 mb-10 w-full text-center">
                            <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1">
                                {/* Using the logo from the public folder */}
                                <img
                                    src="/bentaralogo.jpg"
                                    alt="Bentara Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">BENTARA</span>
                        </div>

                        <h2 className="text-3xl font-bold leading-tight mb-4">Join the Network.</h2>
                        <p className="text-slate-400 leading-relaxed">Secure registration for NHS and Research personnel. Access AI-assisted diagnostics securely.</p>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-300 mb-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">1</div>
                            <p>Enter professional details</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-300 mb-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">2</div>
                            <p>Verify License / ID</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">3</div>
                            <p>Receive Login ID</p>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="p-10 md:w-3/5">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                        <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">
                            Already have an account?
                        </Link>
                    </div>

                    {globalError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                            <span className="font-bold">{globalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Name Section with Title */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 font-medium"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                >
                                    <option value="Dr">Dr</option>
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Ms">Ms</option>
                                    <option value="Prof">Prof</option>
                                </select>
                            </div>
                            <div className="col-span-3 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       placeholder="First Name & Last Name"
                                       value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Role / Grade */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position / Grade</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                            >
                                <optgroup label="Medical Staff (Physician)">
                                    <option value="Consultant">Consultant</option>
                                    <option value="Specialty Doctor">Specialty Doctor (SAS)</option>
                                    <option value="Registrar">Registrar (ST3+)</option>
                                    <option value="SHO">SHO/Core Trainee</option>
                                    <option value="Foundation Doctor">Foundation Doctor (FY1/FY2)</option>
                                </optgroup>
                                <optgroup label="Laboratory & Research">
                                    <option value="Biomedical Scientist">Biomedical Scientist (BMS)</option>
                                    <option value="Lab Technician">Lab Technician</option>
                                    <option value="Researcher">Academic Researcher</option>
                                    <option value="Student">Student/Intern</option>
                                </optgroup>
                                <optgroup label="Administrative">
                                    <option value="Admin/Secretary">Medical Secretary/Admin</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Email & DYNAMIC License ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trust Email</label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       placeholder="name@trust.nhs.uk"
                                       value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            {/* DYNAMIC FIELD: GMC vs Employee ID */}
                            <div className="space-y-1">
                                <label className={`text-xs font-bold uppercase tracking-wider transition-colors ${isPhysician ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {isPhysician ? "GMC Number (7 Digits)" : "Hospital/Trust Employee ID"}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-slate-400">
                                        {/* CHANGED: IdCard is the correct icon name */}
                                        {isPhysician ? <IdCard size={20}/> : <Building size={20}/>}
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        className={`w-full pl-10 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all font-mono
                                    ${isPhysician ? 'border-blue-200 focus:ring-blue-500 focus:bg-white' : 'border-slate-200 focus:ring-slate-400'}
                                `}
                                        placeholder={isPhysician ? "1234567" : "e.g. EMP-9921"}
                                        maxLength={isPhysician ? 7 : 20}
                                        value={formData.license_id}
                                        onChange={e => {
                                            // If physician, only allow numbers
                                            if (isPhysician) {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setFormData({...formData, license_id: val});
                                            } else {
                                                setFormData({...formData, license_id: e.target.value});
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                <input required type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       placeholder="Minimum 8 characters"
                                       value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                                <input required type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       placeholder="Confirm password"
                                       value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                            </button>
                            <p className="text-xs text-center text-slate-400 mt-4">By clicking Create Account, you agree to our Terms of Service regarding patient data privacy.</p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}