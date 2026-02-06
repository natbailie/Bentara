"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { LogIn, Loader2, AlertCircle, Shield, Lock, User } from 'lucide-react';
import api, { UserService } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", identifier);
      formData.append("password", password);

      const tokenRes = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem("access_token", tokenRes.data.access_token);
      const userRes = await UserService.getProfile();
      localStorage.setItem("user_details", JSON.stringify(userRes.data));
      router.push('/dashboard');
    } catch (err: any) {
      const serverMessage = err.response?.data?.detail;
      setError(typeof serverMessage === 'string' ? serverMessage : "Invalid credentials.");
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl border-t-8 border-blue-600">
          <div className="text-center mb-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">BENTARA</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs text-center">Clinical Diagnostic Portal</p>
          </div>

          {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex gap-3 text-sm font-bold">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400" size={20} />
              <input required placeholder="Clinician ID" className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black" value={identifier} onChange={e => setIdentifier(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
              <input required type="password" placeholder="Password" className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Access System</>}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link href="/register" className="text-blue-600 font-bold hover:underline text-sm uppercase tracking-widest">
              Request New Access
            </Link>
          </div>
        </div>
      </div>
  );
}
