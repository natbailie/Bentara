"use client";

import { useState, useEffect } from "react";
import {
    User,
    Building2,
    BadgeCheck,
    Moon,
    Sun,
    Save,
    Loader2,
    CreditCard,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { UserService } from "../../../lib/api";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    // Form State
    const [username, setUsername] = useState("");
    const [formData, setFormData] = useState({
        full_name: "",
        gmc_number: "",
        grade: "",
        trust: "",
        theme_pref: "default"
    });

    // 1. Load User Profile on Mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                const token = localStorage.getItem("token"); // Token is the username in our simple auth

                if (token) {
                    setUsername(token);
                    const res = await UserService.getProfile(token);
                    // Backend returns null fields as null, ensure strings for inputs
                    setFormData({
                        full_name: res.data.full_name || "",
                        gmc_number: res.data.gmc_number || "",
                        grade: res.data.grade || "",
                        trust: res.data.trust || "",
                        theme_pref: res.data.theme_pref || "default"
                    });
                }
            } catch (e) {
                console.error("Failed to load profile", e);
                setMessage({ type: 'error', text: "Could not load user profile." });
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    // 2. Live Theme Preview
    const toggleTheme = (theme: string) => {
        setFormData({ ...formData, theme_pref: theme });
        // Apply immediately for preview
        if (theme === 'inverted') {
            document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
        } else {
            document.documentElement.style.filter = 'none';
        }
    };

    // 3. Save Changes
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await UserService.updateProfile(username, formData);

            // Update LocalStorage so the Dashboard Header updates immediately
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({
                ...currentUser,
                name: formData.full_name,
                details: {
                    grade: formData.grade,
                    trust: formData.trust
                }
            }));

            setMessage({ type: 'success', text: "Profile updated successfully!" });

            // Auto-hide success message
            setTimeout(() => setMessage(null), 3000);

        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: "Failed to save changes." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Preferences...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Settings & Preferences</h1>
                <p className="text-slate-500">Manage your clinical profile and interface options.</p>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">

                {/* SECTION 1: PROFESSIONAL PROFILE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
                        <BadgeCheck size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-800">Professional Details</h3>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">GMC Number</label>
                            <div className="relative">
                                <CreditCard size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    value={formData.gmc_number}
                                    onChange={(e) => setFormData({...formData, gmc_number: e.target.value})}
                                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    placeholder="7654321"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Clinical Grade</label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                            >
                                <option value="">Select Grade...</option>
                                <option value="Consultant">Consultant</option>
                                <option value="Registrar (ST3+)">Registrar (ST3+)</option>
                                <option value="SHO / Core Trainee">SHO / Core Trainee</option>
                                <option value="Foundation Doctor">Foundation Doctor</option>
                                <option value="Biomedical Scientist">Biomedical Scientist</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">NHS Trust / Hospital</label>
                            <div className="relative">
                                <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    value={formData.trust}
                                    onChange={(e) => setFormData({...formData, trust: e.target.value})}
                                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="e.g. St Mary's Hospital"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: APPEARANCE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
                        <Moon size={18} className="text-purple-600" />
                        <h3 className="font-bold text-slate-800">Interface Theme</h3>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Light Mode Card */}
                        <button
                            type="button"
                            onClick={() => toggleTheme('default')}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                formData.theme_pref === 'default'
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-amber-500">
                                <Sun size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900">Standard Light</p>
                                <p className="text-xs text-slate-500">Default clean clinical interface.</p>
                            </div>
                        </button>

                        {/* Dark/Inverted Mode Card */}
                        <button
                            type="button"
                            onClick={() => toggleTheme('inverted')}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                formData.theme_pref === 'inverted'
                                    ? 'border-purple-500 bg-slate-900 ring-1 ring-purple-500'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-purple-400">
                                <Moon size={20} />
                            </div>
                            <div className="text-left">
                                <p className={`font-bold ${formData.theme_pref === 'inverted' ? 'text-white' : 'text-slate-900'}`}>High Contrast</p>
                                <p className="text-xs text-slate-500">Inverted colors for low-light environments.</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Save Changes
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}