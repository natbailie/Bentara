"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = (e: any) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm p-6 bg-gray-50 shadow rounded">
        <img src="/bentaralogo.jpg" className="w-24 mx-auto mb-4" />

        <h1 className="text-xl font-semibold mb-4 text-center">
          Bentara Pathology Login
        </h1>

        <form onSubmit={login} className="space-y-4">
          <input
            className="w-full border rounded p-2"
            placeholder="Username (demo)"
          />
          <input
            type="password"
            className="w-full border rounded p-2"
            placeholder="Password (demo)"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded p-2"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
