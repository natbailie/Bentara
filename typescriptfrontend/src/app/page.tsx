"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Renamed for clarity (holds ID or Email)
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // STEP 1: Get Access Token
      const formData = new URLSearchParams();
      // The backend field is still named 'username', but we send the email/ID string
      formData.append("username", identifier);
      formData.append("password", password);

      const tokenRes = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!tokenRes.ok) {
        throw new Error("Invalid credentials. Please check your ID/Email and password.");
      }

      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;

      // Save Token immediately
      localStorage.setItem("access_token", token);

      // STEP 2: Fetch User Details
      const userRes = await fetch('http://localhost:8000/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userRes.ok) {
        throw new Error("Login succeeded, but failed to load user profile.");
      }

      const userData = await userRes.json();

      // STEP 3: Save User Data & Redirect
      localStorage.setItem("user_details", JSON.stringify(userData));

      setTimeout(() => {
        router.push('/dashboard');
      }, 100);

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_details");
    }
  };

  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">

          {/* LEFT PANEL: BRANDING & LOGO */}
          <div className="bg-slate-900 p-10 md:w-1/2 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

            <div className="relative z-10">
              {/* --- UPDATED LOGO SECTION --- */}
              <div className="flex flex-col items-center gap-6 mb-10 w-full text-center">
                <div className="w-64 h-64 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-2">
                  <img
                      src="/bentaralogo.jpg"
                      alt="Bentara Logo"
                      className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight block leading-none mb-1">BENTARA</span>
                  <span className="text-sm text-blue-400 font-mono tracking-widest uppercase">Clinical AI</span>
                </div>
              </div>

              <h1 className="text-4xl font-bold leading-tight mb-4">
                Intelligent <span className="text-blue-400">Haematology</span> Diagnostics.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Secure access for authorized medical personnel only.
              </p>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-slate-800">
              <p className="text-xs text-slate-500 font-mono">System Version v1.0.0 (Stable)</p>
            </div>
          </div>

          {/* RIGHT PANEL: LOGIN FORM */}
          <div className="p-10 md:w-1/2 flex flex-col justify-center bg-white">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-slate-500 mt-1">Enter your credentials to access the lab.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">

              <div className="space-y-1">
                {/* UPDATED LABEL */}
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login ID / Email</label>
                <input
                    required
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-slate-900 placeholder:text-slate-400"
                    placeholder="6-digit ID or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input
                    required
                    type="password"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <> <LogIn size={20} /> Access Dashboard</>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                New here? <Link href="/user-register" className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all inline-flex items-center gap-1">
                Create an account <ArrowRight size={14} />
              </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Footer / Copyright */}
        <div className="absolute bottom-4 text-center w-full text-xs text-slate-400">
          &copy; 2025 Bentara Clinical Systems. All rights reserved.
        </div>
      </div>
  );
}