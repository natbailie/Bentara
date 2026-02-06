"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import api, { UserService } from '../lib/api'; // Relative path to ensure Vercel resolution

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login Logic
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
      } else {
        // Registration Logic using existing UserService
        await UserService.register({
          username: identifier,
          password: password,
          full_name: fullName,
          role: "Medical Staff"
        });
        setIsLogin(true);
        setError("Account created! Please log in.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.response?.data?.detail || "Connection failure. Check backend status.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Bentara</h1>
          <p className="text-slate-500 mt-2">
            {isLogin ? "Authorized Personnel Only" : "Create New Staff Account"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex gap-3 text-sm font-medium">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input
                required type="text"
                className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username / ID</label>
            <input
              required type="text"
              className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input
              required type="password"
              className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-all shadow-lg mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : 
              isLogin ? <><LogIn size={20} /> Access Dashboard</> : <><UserPlus size={20} /> Register Account</>
            }
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            {isLogin ? "Don't have an account? Register here" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
