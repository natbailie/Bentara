"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "../../lib/api";
import { UserPlus, ArrowRight, Shield } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "", password: "", full_name: "", gmc_number: "", grade: "", trust: ""
    });
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await UserService.register(formData);
            router.push("/"); // Redirect to login on success
        } catch (err) {
            setError("Registration failed. Username may be taken.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side: Info */}
                <div className="bg-blue-600 p-8 text-white md:w-1/3 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Join Bentara</h2>
                        <p className="text-blue-100 text-sm">Create your clinician profile to access advanced AI diagnostics.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-blue-700/50 p-3 rounded-lg mt-8">
                        <Shield size={16} /> Secure NHS-compliant platform
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:w-2/3">
                    <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserPlus className="text-blue-600" /> New Account Registration
                    </h1>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                required placeholder="Username / ID"
                                className="p-3 border rounded-lg bg-slate-50"
                                onChange={e => setFormData({...formData, username: e.target.value})}
                            />
                            <input
                                required type="password" placeholder="Password"
                                className="p-3 border rounded-lg bg-slate-50"
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <input
                            required placeholder="Full Name (e.g. Dr. Sarah Smith)"
                            className="w-full p-3 border rounded-lg bg-slate-50"
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="GMC Number"
                                className="p-3 border rounded-lg bg-slate-50"
                                onChange={e => setFormData({...formData, gmc_number: e.target.value})}
                            />
                            <select
                                className="p-3 border rounded-lg bg-slate-50"
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                            >
                                <option value="">Select Grade</option>
                                <option value="Consultant">Consultant</option>
                                <option value="Registrar">Registrar</option>
                                <option value="SHO">SHO</option>
                                <option value="FY1/2">FY1 / FY2</option>
                            </select>
                        </div>

                        <input
                            placeholder="NHS Trust / Hospital"
                            className="w-full p-3 border rounded-lg bg-slate-50"
                            onChange={e => setFormData({...formData, trust: e.target.value})}
                        />

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                            Create Account <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button onClick={() => router.push('/')} className="text-slate-400 text-sm hover:text-slate-600">
                            Already have an account? Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}