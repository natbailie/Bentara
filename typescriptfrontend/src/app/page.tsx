"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import api, { UserService } from '@/lib/api';

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

      // Phase 1: Authentication using dynamic API instance
      const tokenRes = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = tokenRes.data.access_token;
      localStorage.setItem("access_token", token);

      // Phase 2: Session Sync
      // Verifies connection and retrieves profile for dashboard
      const userRes = await UserService.getProfile();
      localStorage.setItem("user_details", JSON.stringify(userRes.data));

      router.push('/dashboard');

    } catch (err: any) {
      console.error("System Error:", err);
      setError(err.response?.data?.detail || "Connection failure. Check if backend is active.");
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Bentara Portal</h1>
            <p className="text-slate-500 mt-2">Authorized Personnel Only</p>
          </div>

          {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex gap-3 animate-pulse">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username / ID</label>
              <input
                  required type="text"
                  className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                  required type="password"
                  className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Access Dashboard</>}
            </button>
          </form>
        </div>
      </div>
  );
}