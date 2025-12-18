"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck, ImageIcon } from "lucide-react";
import api from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);

      const response = await api.post('/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = response.data.access_token;
      localStorage.setItem("token", token);

      const userDetails = response.data.user_details || { name: formData.username };
      const userStorage = {
        name: userDetails.full_name || formData.username,
        details: {
          grade: userDetails.grade || "Clinician",
          trust: userDetails.trust || "NHS Trust"
        }
      };

      localStorage.setItem("user", JSON.stringify(userStorage));

      if (userDetails.theme_pref === 'inverted') {
        document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
      } else {
        document.documentElement.style.filter = 'none';
      }

      router.push("/dashboard");

    } catch (err) {
      console.error("Login Failed", err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-900">

        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500 border border-slate-200/50">

          {/* LOGO SECTION - STANDARD PUBLIC FOLDER METHOD */}
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 relative hover:scale-105 transition-transform duration-300">
              <img
                  src="/bentaralogo.jpg" // Next.js maps this to public/bentaralogo.jpg
                  alt="Bentara Logo"
                  className="object-contain w-full h-full drop-shadow-xl"
                  onError={(e) => {
                    // Debug helper: This will show up if it STILL fails
                    console.error("Image failed to load:", e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
              />
              {/* Fallback Icon (Only visible if img hides itself on error) */}
              <div className="absolute inset-0 -z-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-300">
                <ImageIcon size={32} />
              </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bentara Pathology</h1>
            <p className="text-slate-500 mt-2 font-medium">AI-Assisted Haematology Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Clinician ID / Username</label>
              <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
              <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••"
              />
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center font-medium">
                  {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={22} />}
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 mb-3">New to the department?</p>
            <button
                onClick={() => router.push('/register')}
                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors text-sm"
            >
              Create Clinician Account
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <ShieldCheck size={14} /> HIPAA Compliant
            </div>
            <div className="text-xs text-slate-400">v3.0.0 (Secure)</div>
          </div>
        </div>
      </div>
  );
}