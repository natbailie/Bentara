"use client";

import { useState, useEffect } from 'react';
import {
    Save,
    User,
    Mail,
    Shield,
    Loader2,
    CheckCircle,
    AlertCircle,
    IdCard,
    Building,
    AtSign,
    Lock,
    KeyRound
} from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Logic State
    const [isPhysician, setIsPhysician] = useState(true);

    // Profile Form State
    const [formData, setFormData] = useState({
        title: "Dr",
        first_name: "",
        username: "",
        email: "",
        role: "",
        license_id: ""
    });

    // Password Form State
    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [savingPass, setSavingPass] = useState(false);

    // 1. Fetch User Data
    useEffect(() => {
        const fetchUserData = async () => {
            let backendSuccess = false;
            let data: any = {};

            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch('http://localhost:8000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    data = await res.json();
                    backendSuccess = true;
                }
            } catch (err) {
                console.warn("Backend fetch failed, checking local storage.");
            }

            if (!backendSuccess) {
                const storedUser = localStorage.getItem("user_details");
                if (storedUser) data = JSON.parse(storedUser);
            }

            if (data.full_name) {
                const parts = data.full_name.split(" ");
                const possibleTitle = parts[0];
                const titles = ["Dr", "Mr", "Mrs", "Ms", "Prof"];

                if (titles.includes(possibleTitle)) {
                    setFormData({
                        title: possibleTitle,
                        first_name: parts.slice(1).join(" "),
                        username: data.username || "",
                        email: data.email || "",
                        role: data.role || "Consultant",
                        license_id: data.license_id || ""
                    });
                } else {
                    setFormData({
                        title: "Dr",
                        first_name: data.full_name,
                        username: data.username || "",
                        email: data.email || "",
                        role: data.role || "Consultant",
                        license_id: data.license_id || ""
                    });
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const nonPhysicianRoles = ["Lab Technician", "Biomedical Scientist", "Researcher", "Admin / Secretary", "Student"];
        setIsPhysician(!nonPhysicianRoles.includes(formData.role));
    }, [formData.role]);

    // 2. Handle Profile Update
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const finalFullName = `${formData.title} ${formData.first_name}`.trim();
        const payload = {
            full_name: finalFullName,
            username: formData.username,
            email: formData.email,
            role: formData.role,
            license_id: formData.license_id
        };

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch('http://localhost:8000/users/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to update.");
            localStorage.setItem("user_details", JSON.stringify({ ...payload }));
            setMessage({ type: 'success', text: "Profile details updated successfully." });
        } catch (err) {
            setMessage({ type: 'error', text: "Failed to save profile changes." });
        } finally {
            setSaving(false);
        }
    };

    // 3. Handle Password Change
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (passData.newPassword.length < 8) {
            setMessage({ type: 'error', text: "New password must be at least 8 characters long." });
            return;
        }
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match." });
            return;
        }

        setSavingPass(true);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch('http://localhost:8000/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passData.currentPassword,
                    new_password: passData.newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || "Failed to change password.");

            setMessage({ type: 'success', text: "Password changed successfully." });
            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Reset form
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSavingPass(false);
        }
    };

    if (loading) return <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3"><Loader2 className="animate-spin" size={32}/><p>Loading...</p></div>;

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">

            <div className="mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
                <p className="text-slate-500 mt-1">Manage your personal details and security preferences.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                    {message.text}
                </div>
            )}

            {/* --- PROFILE FORM --- */}
            <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-8">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Information</h3>

                {/* Name Section */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                        <select
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        >
                            <option value="Dr">Dr</option>
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                            <option value="Prof">Prof</option>
                        </select>
                    </div>
                    <div className="col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500" size={18} />
                            <input
                                type="text" required
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                                value={formData.first_name}
                                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username (LOCKED) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock size={10} /> Username (Unchangeable)
                        </label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                disabled
                                className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed select-none"
                                value={formData.username}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500" size={18} />
                            <input
                                type="email" required
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Role & ID */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <div className="relative group">
                        <Shield className="absolute left-3 top-3 text-slate-400 group-focus-within:text-purple-500" size={18} />
                        <select
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <optgroup label="Medical Staff (Physician)">
                                <option value="Consultant">Consultant</option>
                                <option value="Specialty Doctor">Specialty Doctor</option>
                                <option value="Registrar">Registrar</option>
                                <option value="SHO">SHO</option>
                                <option value="Foundation Doctor">Foundation Doctor</option>
                            </optgroup>
                            <optgroup label="Laboratory & Research">
                                <option value="Biomedical Scientist">Biomedical Scientist</option>
                                <option value="Lab Technician">Lab Technician</option>
                                <option value="Researcher">Researcher</option>
                                <option value="Student">Student/Intern</option>
                            </optgroup>
                            <optgroup label="Administrative">
                                <option value="Admin/Secretary">Admin</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isPhysician ? 'text-blue-600' : 'text-slate-500'}`}>
                        {isPhysician ? "GMC Number" : "Employee ID"}
                    </label>
                    <div className="relative group">
                        <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500">
                            {isPhysician ? <IdCard size={20} /> : <Building size={20} />}
                        </div>
                        <input
                            type="text" required
                            className={`w-full pl-10 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all font-mono
                                ${isPhysician ? 'border-blue-200 focus:ring-blue-500 focus:bg-white' : 'border-slate-200 focus:ring-slate-400'}
                            `}
                            value={formData.license_id}
                            onChange={(e) => {
                                if (isPhysician) {
                                    setFormData({...formData, license_id: e.target.value.replace(/\D/g, '')});
                                } else {
                                    setFormData({...formData, license_id: e.target.value});
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Profile
                    </button>
                </div>
            </form>

            {/* --- SECURITY FORM (PASSWORD) --- */}
            <form onSubmit={handlePasswordSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <KeyRound size={20} className="text-blue-500"/> Security & Password
                </h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                        <input
                            type="password" required
                            placeholder="Enter your current password"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={passData.currentPassword}
                            onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                            <input
                                type="password" required
                                placeholder="Minimum 8 characters"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={passData.newPassword}
                                onChange={e => setPassData({...passData, newPassword: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                            <input
                                type="password" required
                                placeholder="Re-enter new password"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={passData.confirmPassword}
                                onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={savingPass} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center gap-2">
                        {savingPass ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                        Update Password
                    </button>
                </div>
            </form>

        </div>
    );
}