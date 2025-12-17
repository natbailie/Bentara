"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';
import api from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/login', { username, password });
      if (res.data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">

        {/* Container is explicitly set to max-width: 24rem (sm) */}
        <div className="w-full max-w-[24rem] overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* Header */}
          <div className="bg-blue-600 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg">
              <img
                  src="/bentaralogo.jpg"
                  alt="Bentara Logo"
                  className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Bentara</h1>
            <p className="mt-1 text-xs font-medium text-blue-100">Pathology Intelligence Unit</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 p-6">
            {error && (
                <div className="rounded border border-red-100 bg-red-50 p-2 text-center text-xs text-red-600">
                  {error}
                </div>
            )}

            <div className="space-y-1">
              <label className="ml-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ID"
                    required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                />
              </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`mt-2 w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-medium text-slate-400">Authorized Access Only • v1.0</p>
          </div>
        </div>
      </div>
  );
}