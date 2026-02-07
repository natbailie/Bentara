"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
/** * FIXED IMPORT: Using the '@' alias points directly to the 'src' directory.
 * This resolves "Module not found" errors during Vercel deployment.
 */
import api from '@/lib/api';

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
            /** * REPLACED: fetch('http://localhost:8000/...') with api.post('/...')
             * This automatically uses the cloud URL configured in your environment.
             */
            await api.post('/reset-password', {
                email,
                new_password: newPassword
            });

            setSuccess(true);
        } catch (err: any) {
            console.error("Reset Password Error:", err);
            /** * Extracts clean error messages from the backend response.
             * This prevents rendering objects directly, which can cause React errors.
             */
            const serverMsg = err.response?.data?.detail;
            setError(typeof serverMsg === 'string' ? serverMsg : "Email not found or system error.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 text-black">Password Reset</h2>
                    <p className="text-slate-500 mb-6">Your password has been updated successfully.</p>
                    <Link href="/" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-black">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 animate-in fade-in duration-500">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
                <p className="text-slate-500 mb-6 text-sm">Enter your Trust Email to reset your account password.</p>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Trust Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input
                                required
                                type="email"
                                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                                placeholder="name@trust.nhs.uk"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input
                                required
                                type="password"
                                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : <>Reset Password <ArrowRight size={18}/></>}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">Cancel</Link>
                </div>
            </div>
        </div>
    );
}