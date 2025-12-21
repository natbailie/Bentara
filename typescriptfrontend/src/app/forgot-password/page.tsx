"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch('http://localhost:8000/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, new_password: newPassword }),
            });

            if (!res.ok) throw new Error("Email not found or system error.");
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset</h2>
                    <p className="text-slate-500 mb-6">Your password has been updated successfully.</p>
                    <Link href="/" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
                <p className="text-slate-500 mb-6 text-sm">Enter your Trust Email to reset your account password.</p>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Trust Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input required type="email" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg" placeholder="name@trust.nhs.uk" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input required type="password" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <>Reset Password <ArrowRight size={18}/></>}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    {/* FIXED LINE BELOW */}
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">Cancel</Link>
                </div>
            </div>
        </div>
    );
}