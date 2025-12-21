"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Printer, Loader2, AlertCircle, Scan, Download, CheckCircle, ShieldCheck,
    Maximize2, X, ZoomIn, ZoomOut, History, Filter, Layers, Eye, EyeOff, BarChart3
} from 'lucide-react';

// --- CELL CATEGORY MAPPING ---
const CELL_CATEGORIES: Record<string, string[]> = {
    "WBC": ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil", "Blast Cell", "Promyelocyte"],
    "RBC": ["RBC", "Normoblast", "Sickle Cell", "Target Cell", "Schistocyte"],
    "Platelets": ["Platelet", "Giant Platelet"]
};

const getCategory = (label: string) => {
    for (const [cat, types] of Object.entries(CELL_CATEGORIES)) {
        if (types.some(t => label.toLowerCase().includes(t.toLowerCase()))) return cat;
    }
    return "Other";
};

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Auth State
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSigningOff, setIsSigningOff] = useState(false);

    // Viewer State
    const [isExpanded, setIsExpanded] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [manualZoom, setManualZoom] = useState("100");
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Filter & Data State
    const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["WBC", "RBC", "Platelets", "Other"]));
    const [activeSubtypes, setActiveSubtypes] = useState<Set<string>>(new Set());
    const [availableSubtypes, setAvailableSubtypes] = useState<Record<string, Set<string>>>({});
    const [cellCounts, setCellCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const userStr = localStorage.getItem("user_details");
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchReport();
    }, [params.id]);

    useEffect(() => {
        setManualZoom(Math.round(zoom * 100).toString());
    }, [zoom]);

    const fetchReport = () => {
        const token = localStorage.getItem("access_token");
        fetch(`http://localhost:8000/reports/${params.id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.ok ? res.json() : Promise.reject("Failed"))
            .then(d => {
                setData(d);
                setLoading(false);

                if (d.detections) {
                    const subtypes: Record<string, Set<string>> = {};
                    const initialActiveSubtypes = new Set<string>();
                    const counts: Record<string, number> = {};

                    d.detections.forEach((det: any) => {
                        // 1. Organize for Filters
                        const cat = getCategory(det.label);
                        if (!subtypes[cat]) subtypes[cat] = new Set();
                        subtypes[cat].add(det.label);
                        initialActiveSubtypes.add(det.label);

                        // 2. Calculate Counts
                        counts[det.label] = (counts[det.label] || 0) + 1;
                    });

                    setAvailableSubtypes(subtypes);
                    setActiveSubtypes(initialActiveSubtypes);
                    setCellCounts(counts);
                }
            })
            .catch(() => setLoading(false));
    };

    const handleSignOff = async () => {
        setIsSigningOff(true);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`http://localhost:8000/reports/${params.id}/signoff`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchReport();
            else alert("Authorization Failed: Permission denied.");
        } catch (err) { alert("Network Error"); }
        finally { setIsSigningOff(false); }
    };

    // --- ZOOM LOGIC ---
    const handleWheel = (e: React.WheelEvent) => {
        if (!isExpanded) return;
        e.stopPropagation();
        const direction = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(Math.max(0.1, zoom + direction), 10);
        setZoom(Number(newZoom.toFixed(1)));
    };

    const handleManualZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setManualZoom(e.target.value);
    };

    const applyManualZoom = () => {
        let val = parseInt(manualZoom.replace(/\D/g, ''));
        if (isNaN(val)) val = 100;
        val = Math.max(10, Math.min(val, 1000));
        setZoom(val / 100);
        setManualZoom(val.toString());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyManualZoom();
    };

    const startDrag = (e: React.MouseEvent) => {
        if (zoom > 1 || true) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const onDrag = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const stopDrag = () => setIsDragging(false);

    // --- FILTERS ---
    const toggleCategory = (cat: string) => {
        const newCats = new Set(activeCategories);
        const newSubs = new Set(activeSubtypes);
        if (newCats.has(cat)) {
            newCats.delete(cat);
            if(availableSubtypes[cat]) availableSubtypes[cat].forEach(s => newSubs.delete(s));
        } else {
            newCats.add(cat);
            if(availableSubtypes[cat]) availableSubtypes[cat].forEach(s => newSubs.add(s));
        }
        setActiveCategories(newCats);
        setActiveSubtypes(newSubs);
    };

    const toggleSubtype = (subtype: string) => {
        const newSubs = new Set(activeSubtypes);
        if (newSubs.has(subtype)) newSubs.delete(subtype);
        else newSubs.add(subtype);
        setActiveSubtypes(newSubs);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center text-red-500">Report not found.</div>;

    return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">

            {/* TOOLBAR */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                    <Maximize2 size={18} /> Open Interactive Viewer
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-all shadow-lg">
                    <Download size={18} /> Export PDF
                </button>
            </div>

            {/* REPORT PAPER */}
            <div className="max-w-4xl mx-auto bg-white p-12 min-h-[1123px] shadow-2xl print:shadow-none print:min-h-0 relative">
                {data.status === "Pending" && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-red-100 font-black text-9xl pointer-events-none border-4 border-red-100 p-10 opacity-50">DRAFT</div>}

                {/* HEADER */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-lg border border-slate-100 p-1"><img src="/bentaralogo.jpg" className="w-full h-full object-contain"/></div>
                        <div><h1 className="text-2xl font-bold text-slate-900">BENTARA LABS</h1><p className="text-xs text-slate-500 uppercase tracking-widest">Haematology AI Unit</p></div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-900">DIAGNOSTIC REPORT</h2>
                        <p className="font-mono text-sm text-slate-500">REF: #{data.id.toString().padStart(6, '0')}</p>
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${data.status === 'Authorized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {data.status}
                        </div>
                    </div>
                </div>

                {/* PATIENT INFO */}
                <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-slate-50 relative z-10">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Patient Name</p><p className="font-bold text-lg">{data.patient.name}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">MRN / NHS No.</p><p className="font-mono font-bold text-lg">{data.patient.mrn}</p><p className="text-xs text-slate-500 font-mono">{data.patient.nhs_number}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Sample Type</p><p className="font-medium">{data.sample_type}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Date</p><p className="font-medium">{data.sample_date}</p></div>
                </div>

                {/* AUTOMATED CELL COUNT (NEW SECTION) */}
                {Object.keys(cellCounts).length > 0 && (
                    <div className="mb-8 break-inside-avoid relative z-10">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <BarChart3 size={16}/> Automated Cell Count
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.keys(CELL_CATEGORIES).map(cat => {
                                // Filter counts belonging to this category
                                const catCounts = Object.entries(cellCounts).filter(([label]) =>
                                    CELL_CATEGORIES[cat].some(t => label.toLowerCase().includes(t.toLowerCase()))
                                );

                                if (catCounts.length === 0) return null;

                                return (
                                    <div key={cat} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase text-slate-600">
                                            {cat} Series
                                        </div>
                                        <table className="w-full text-sm">
                                            <tbody>
                                            {catCounts.map(([label, count]) => (
                                                <tr key={label} className="border-b border-slate-100 last:border-0">
                                                    <td className="px-4 py-2 text-slate-700">{label}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">{count}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}

                            {/* Render 'Other' category if any */}
                            {Object.entries(cellCounts).filter(([label]) => getCategory(label) === 'Other').length > 0 && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase text-slate-600">Other</div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {Object.entries(cellCounts)
                                            .filter(([label]) => getCategory(label) === 'Other')
                                            .map(([label, count]) => (
                                                <tr key={label} className="border-b border-slate-100 last:border-0">
                                                    <td className="px-4 py-2 text-slate-700">{label}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">{count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STATIC IMAGE PREVIEW */}
                <div className="mb-8 break-inside-avoid relative z-10">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Microscopic Analysis</h3>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div onClick={() => setIsExpanded(true)} className="relative w-72 h-72 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 cursor-zoom-in hover:shadow-lg transition-all group">
                            <img src={`http://localhost:8000${data.image_url}`} className="w-full h-full object-cover" />
                            {data.detections && data.detections.map((box: any, i: number) => (
                                <div key={i} className="absolute border-2 border-red-500 bg-red-500/10" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}></div>
                            ))}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold flex gap-2"><Maximize2 size={14}/> Click to Analyze</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div><p className="text-xs font-bold text-slate-400 uppercase">Primary Diagnosis</p><p className="text-3xl font-bold text-blue-600">{data.diagnosis}</p></div>
                            <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Confidence</p><div className="flex items-center gap-3"><div className="w-full bg-slate-200 h-3 rounded-full max-w-[200px]"><div className="bg-blue-600 h-full rounded-full print:bg-black" style={{width: data.confidence}}></div></div><span className="font-mono text-lg font-bold">{data.confidence}</span></div></div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100"><p className="text-xs font-bold text-yellow-700 uppercase mb-1">Notes</p><p className="text-sm italic">{data.notes || "None"}</p></div>
                        </div>
                    </div>
                </div>

                {/* AUDIT LOG */}
                {data.audit_trail && data.audit_trail.length > 0 && (
                    <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 print:hidden">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><History size={14}/> Audit Trail</h4>
                        {data.audit_trail.map((log: any, i: number) => (
                            <div key={i} className="flex justify-between border-b border-slate-200 last:border-0 py-1"><span className="font-medium">{log.details}</span><span className="font-mono text-slate-400">{log.time}</span></div>
                        ))}
                    </div>
                )}

                {/* FOOTER */}
                <div className="mt-12 pt-8 border-t-2 border-slate-100 text-sm text-slate-500 flex justify-between items-end">
                    <div>
                        <p className="uppercase text-xs font-bold mb-4">Authorized By:</p>
                        <div className="h-12 border-b border-slate-900 w-48 mb-2 flex items-end pb-1">{data.status === 'Authorized' && <span className="font-script text-2xl text-slate-900 italic">{data.consultant.name}</span>}</div>
                        <p className="font-bold text-slate-900">{data.consultant.name}</p><p className="text-xs uppercase">{data.consultant.role}</p>
                    </div>
                    <div className="text-right"><p>Generated: {new Date().toLocaleDateString()}</p></div>
                </div>
            </div>

            {/* SIGN OFF UI */}
            <div className="max-w-4xl mx-auto mt-8 print:hidden">
                {data.status === "Pending" ? (
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-lg flex items-center justify-between">
                        <div><h3 className="font-bold">Review Pending</h3><p className="text-sm text-slate-500">Waiting for authorization.</p></div>
                        {(currentUser?.role === "Consultant" || currentUser?.role.includes("Pathologist")) ? (
                            <button onClick={handleSignOff} disabled={isSigningOff} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                                {isSigningOff ? <Loader2 className="animate-spin"/> : <ShieldCheck />} Sign Off
                            </button>
                        ) : <span className="bg-slate-100 px-3 py-2 rounded font-bold text-slate-400 text-sm">Consultant Access Required</span>}
                    </div>
                ) : <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex items-center gap-4 text-emerald-800"><CheckCircle /> <div><p className="font-bold">Authorized</p></div></div>}
            </div>

            {/* --- INTERACTIVE MICROSCOPE MODAL --- */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 bg-black/95 flex overflow-hidden">

                    {/* LEFT: MAIN VIEWER */}
                    <div
                        className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center cursor-move"
                        onWheel={handleWheel}
                        onMouseDown={startDrag}
                        onMouseMove={onDrag}
                        onMouseUp={stopDrag}
                        onMouseLeave={stopDrag}
                    >
                        <div
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                            className="relative shadow-2xl origin-center"
                        >
                            <img src={`http://localhost:8000${data.image_url}`} draggable={false} className="max-w-none" style={{ height: '80vh' }} />
                            {data.detections && data.detections.map((box: any, i: number) => {
                                if (!activeSubtypes.has(box.label)) return null;
                                return (
                                    <div key={i} className="absolute border-2 border-red-500/80 bg-red-500/10 hover:bg-red-500/30 transition-colors cursor-help group"
                                         style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}>
                                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                            {box.label} ({box.score})
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ZOOM CONTROLS */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/10">
                            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                                <span className="text-xs font-bold uppercase text-white/50">Zoom</span>
                                <button onClick={() => setZoom(Math.max(0.1, Number((zoom - 0.1).toFixed(1))))} className="hover:text-blue-400 p-1"><ZoomOut size={18}/></button>
                                <div className="relative group">
                                    <input type="text" value={manualZoom} onChange={handleManualZoomChange} onKeyDown={handleKeyDown} onBlur={applyManualZoom} className="w-12 bg-transparent text-center font-mono focus:outline-none focus:text-blue-400 border-b border-transparent focus:border-blue-400 transition-all"/>
                                    <span className="absolute -right-2 top-0 text-white/50">%</span>
                                </div>
                                <button onClick={() => setZoom(Math.min(10, Number((zoom + 0.1).toFixed(1))))} className="hover:text-blue-400 p-1"><ZoomIn size={18}/></button>
                            </div>
                            <div className="text-xs text-white/50">Drag to Pan • Scroll to Zoom</div>
                            <button onClick={() => {setPan({x:0,y:0}); setZoom(1); setManualZoom("100");}} className="text-xs font-bold text-blue-400 hover:text-white">Reset</button>
                        </div>
                    </div>

                    {/* RIGHT: FILTER SIDEBAR */}
                    <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col shadow-2xl z-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2"><Layers size={18} className="text-blue-500"/> Cell Layers</h3>
                            <button onClick={() => setIsExpanded(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {Object.entries(availableSubtypes).map(([category, subtypes]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`font-bold uppercase tracking-wider text-xs ${activeCategories.has(category) ? 'text-blue-400' : 'text-zinc-600'}`}>{category}</span>
                                        <button onClick={() => toggleCategory(category)} className="text-zinc-500 hover:text-white">
                                            {activeCategories.has(category) ? <Eye size={14}/> : <EyeOff size={14}/>}
                                        </button>
                                    </div>
                                    <div className="space-y-1 ml-2 border-l-2 border-zinc-800 pl-3">
                                        {Array.from(subtypes).map(subtype => (
                                            <button
                                                key={subtype}
                                                onClick={() => toggleSubtype(subtype)}
                                                className={`w-full text-left flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-all ${activeSubtypes.has(subtype) ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}
                                            >
                                                <span>{subtype}</span>
                                                {activeSubtypes.has(subtype) && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}