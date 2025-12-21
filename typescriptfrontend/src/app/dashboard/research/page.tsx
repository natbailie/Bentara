"use client";

import { useState, useRef, useEffect } from 'react';
import {
    Microscope, UploadCloud, Image as ImageIcon, ArrowLeft, Search, Database,
    FlaskConical, Dna, Droplets, Loader2, CheckCircle, Plus, X, Tag,
    ZoomIn, ZoomOut, Move, MousePointer2, ChevronRight, ChevronDown, Layers, Trash2,
    BookOpen, Activity, Target, Filter
} from 'lucide-react';

// --- TAXONOMIES ---
const CELL_TAXONOMY: Record<string, any> = {
    "White Blood Cells (WBC)": {
        "Neutrophil": ["Segmented (Mature)", "Band Form", "Hypersegmented", "Toxic Granulation"],
        "Lymphocyte": ["Normal", "Reactive / Atypical", "Large Granular", "Plasma Cell", "Prolymphocyte"],
        "Monocyte": ["Normal", "Vacuolated", "Promonocyte"],
        "Eosinophil": ["Normal", "De-granulated"],
        "Basophil": ["Normal"],
        "Immature / Malignant": ["Blast Cell", "Promyelocyte", "Myelocyte", "Metamyelocyte", "Auer Rod Present"]
    },
    "Red Blood Cells (RBC)": {
        "Morphology": ["Normocytic", "Macrocytic", "Microcytic", "Hypochromic"],
        "Shape Abnormalities": ["Target Cell", "Sickle Cell", "Elliptocyte", "Schistocyte (Fragment)", "Teardrop", "Spherocyte", "Stomatocyte", "Burr Cell (Echinocyte)", "Acanthocyte"],
        "Inclusions": ["Howell-Jolly Body", "Basophilic Stippling", "Pappenheimer Body", "Cabot Ring"],
        "Immature": ["Nucleated RBC (Normoblast)", "Reticulocyte"]
    },
    "Platelets": {
        "General": ["Normal Platelet", "Large / Giant Platelet", "Platelet Clump", "Hypogranular"]
    }
};

const DISEASE_TAXONOMY: Record<string, any> = {
    "Acute Leukaemias": {
        "AML": ["AML with recurrent genetic abnormalities", "AML with multilineage dysplasia", "AML, NOS (M0-M7)", "Acute Promyelocytic Leukaemia (APL/M3)"],
        "ALL": ["B-lymphoblastic leukaemia", "T-lymphoblastic leukaemia", "Burkitt Leukaemia"]
    },
    "Myeloproliferative (MPN)": {
        "CML": ["Chronic Phase", "Accelerated Phase", "Blast Crisis"],
        "Other MPN": ["Polycythaemia Vera", "Essential Thrombocythaemia", "Primary Myelofibrosis"]
    },
    "Lymphoproliferative": {
        "CLL": ["Chronic Lymphocytic Leukaemia", "Monoclonal B-cell Lymphocytosis"],
        "Lymphoma": ["Mantel Cell", "Follicular", "Marginal Zone", "Hairy Cell Leukaemia"]
    },
    "Anaemias / Other": {
        "Nutritional": ["Iron Deficiency", "B12/Folate Deficiency (Megaloblastic)"],
        "Haemolytic": ["Autoimmune Haemolytic", "G6PD Deficiency", "Hereditary Spherocytosis"],
        "Reactive": ["Infectious Mononucleosis", "Septic Shift / Left Shift"]
    }
};

export default function ResearchHub() {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<'upload' | 'gallery' | null>(null);
    const [selectedType, setSelectedType] = useState<string>("");

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notes, setNotes] = useState("");

    const [boxes, setBoxes] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);

    const [zoom, setZoom] = useState(1);
    const [manualZoom, setManualZoom] = useState("100");
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [tool, setTool] = useState<'draw' | 'pan'>('pan');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [currentBox, setCurrentBox] = useState<any>(null);
    const [startPoint, setStartPoint] = useState({x:0, y:0});

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isLabeling, setIsLabeling] = useState(false);
    const [pendingBox, setPendingBox] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [isChoosingDisease, setIsChoosingDisease] = useState(false);
    const [diseaseCategory, setDiseaseCategory] = useState<string | null>(null);
    const [selectedDisease, setSelectedDisease] = useState<string>("Normal / Unspecified");

    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [viewingSample, setViewingSample] = useState<any | null>(null);
    const [diseaseFilter, setDiseaseFilter] = useState<string>("All Diseases");

    const SAMPLE_TYPES = [
        { name: "Peripheral Blood Smear", icon: Droplets, desc: "Standard blood films." },
        { name: "Bone Marrow Aspirate", icon: Dna, desc: "Marrow slides." },
        { name: "Lymph Node Biopsy", icon: Microscope, desc: "Tissue sections." }
    ];

    useEffect(() => { setManualZoom(Math.round(zoom * 100).toString()); }, [zoom]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndex !== null) {
                setBoxes(prev => prev.filter((_, i) => i !== selectedIndex));
                setSelectedIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex]);

    const loadGallery = async () => {
        setLoadingGallery(true);
        try {
            const res = await fetch(`http://localhost:8000/research/gallery?sample_type=${encodeURIComponent(selectedType)}`);
            const d = await res.json();
            setGalleryItems(d);
        } catch(e) { console.error(e); }
        finally { setLoadingGallery(false); }
    };

    useEffect(() => {
        if (mode === 'gallery' && selectedType) loadGallery();
    }, [mode, selectedType]);

    // Helper functions
    const updateZoom = (val: number) => {
        const newZoom = Math.min(Math.max(0.1, val), 10);
        setZoom(Number(newZoom.toFixed(1)));
        setPan(prev => clampPan(prev.x, prev.y, newZoom));
    };

    const getLabelCounts = () => {
        const counts: Record<string, number> = {};
        boxes.forEach(box => { counts[box.label] = (counts[box.label] || 0) + 1; });
        return counts;
    };

    const getRelCoords = (e: React.MouseEvent) => {
        if (!imgRef.current) return {x:0, y:0};
        const rect = imgRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const clampPan = (newX: number, newY: number, currentZoom: number) => {
        if (!containerRef.current || !imgRef.current) return { x: newX, y: newY };
        const container = containerRef.current.getBoundingClientRect();
        const imgW = imgRef.current.offsetWidth * currentZoom;
        const imgH = imgRef.current.offsetHeight * currentZoom;
        let maxX = Math.max(0, (imgW - container.width) / 2);
        let maxY = Math.max(0, (imgH - container.height) / 2);
        return { x: Math.min(Math.max(newX, -maxX), maxX), y: Math.min(Math.max(newY, -maxY), maxY) };
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
            setBoxes([]);
            setZoom(1);
            setPan({x:0, y:0});
            setTool('pan');
        }
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (!imgRef.current) return;
        if (tool === 'pan') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }
        if (resizeHandle && selectedIndex !== null) {
            setIsDragging(true);
            setStartPoint(getRelCoords(e));
            return;
        }
        const coords = getRelCoords(e);
        setStartPoint(coords);
        setIsDragging(true);
        setCurrentBox({x: coords.x, y: coords.y, w:0, h:0});
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        if (tool === 'pan') {
            setPan(clampPan(e.clientX - dragStart.x, e.clientY - dragStart.y, zoom));
            return;
        }
        if (resizeHandle && selectedIndex !== null) {
            const current = getRelCoords(e);
            const box = boxes[selectedIndex];
            let newBox = { ...box };
            if (resizeHandle === 'se') { newBox.w = current.x - box.x; newBox.h = current.y - box.y; }
            else if (resizeHandle === 'sw') { newBox.w = (box.x + box.w) - current.x; newBox.h = current.y - box.y; newBox.x = current.x; }
            else if (resizeHandle === 'nw') { newBox.w = (box.x + box.w) - current.x; newBox.h = (box.y + box.h) - current.y; newBox.x = current.x; newBox.y = current.y; }
            else if (resizeHandle === 'ne') { newBox.w = current.x - box.x; newBox.h = (box.y + box.h) - current.y; newBox.y = current.y; }
            const newBoxes = [...boxes];
            newBoxes[selectedIndex] = newBox;
            setBoxes(newBoxes);
            return;
        }
        if (tool === 'draw' && currentBox) {
            const current = getRelCoords(e);
            setCurrentBox({
                x: Math.min(current.x, startPoint.x),
                y: Math.min(current.y, startPoint.y),
                w: Math.abs(current.x - startPoint.x),
                h: Math.abs(current.y - startPoint.y)
            });
        }
    };

    const onMouseUp = () => {
        setIsDragging(false);
        if (tool === 'draw' && currentBox && currentBox.w > 0.5) {
            setPendingBox(currentBox);
            setIsLabeling(true);
        }
        setCurrentBox(null);
        if (!isDragging) setResizeHandle(null);
    };

    const commitLabel = (label: string) => {
        if (pendingBox) {
            setBoxes([...boxes, { ...pendingBox, label }]);
            setPendingBox(null);
            setIsLabeling(false);
            setSelectedCategory(null);
            setTool('pan');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sample_type", selectedType);
        formData.append("notes", notes);
        formData.append("annotations", JSON.stringify({
            cells: boxes,
            diagnosis: selectedDisease
        }));

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch('http://localhost:8000/research/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setShowSuccessModal(true);
            }
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        loadGallery(); // Refresh gallery on close
        setStep(1);
        setFile(null);
        setPreviewUrl(null);
        setBoxes([]);
        setNotes("");
        setSelectedDisease("Normal / Unspecified");
        setTool('pan');
    };

    const renderMainMenu = () => (
        <div className="max-w-4xl mx-auto pt-10 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Research Hub</h1>
                <p className="text-slate-500 text-lg">Contribute and explore anonymized pathology data.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => { setMode('upload'); setStep(1); }} className="group relative bg-white p-10 rounded-3xl border-2 border-slate-100 hover:border-blue-500 transition-all text-left shadow-sm">
                    <UploadCloud size={40} className="mb-4 text-blue-600" />
                    <h2 className="text-2xl font-bold">Contribute Data</h2>
                </button>
                <button onClick={() => { setMode('gallery'); setStep(1); }} className="group relative bg-white p-10 rounded-3xl border-2 border-slate-100 hover:border-purple-500 transition-all text-left shadow-sm">
                    <Database size={40} className="mb-4 text-purple-600" />
                    <h2 className="text-2xl font-bold">Explore Galleries</h2>
                </button>
            </div>
        </div>
    );

    const renderTypeSelection = () => (
        <div className="max-w-4xl mx-auto pt-6 px-4">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-slate-400 font-bold mb-8 hover:text-slate-600 transition-colors"><ArrowLeft size={20}/> Back</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_TYPES.map((type) => (
                    <button key={type.name} onClick={() => { setSelectedType(type.name); setStep(2); }} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 flex items-center gap-6 text-left group">
                        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><type.icon size={24} /></div>
                        <div><h3 className="font-bold text-lg">{type.name}</h3><p className="text-sm text-slate-500">{type.desc}</p></div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderGallery = () => {
        const filteredItems = galleryItems.filter(item => {
            if (diseaseFilter === "All Diseases") return true;
            try {
                const diag = JSON.parse(item.annotations).diagnosis;
                return diag === diseaseFilter;
            } catch(e) { return false; }
        });

        const filterOptions: string[] = ["All Diseases"];
        galleryItems.forEach(item => {
            try {
                const diag = JSON.parse(item.annotations).diagnosis;
                if (diag && !filterOptions.includes(diag)) filterOptions.push(diag);
            } catch(e) {}
        });

        return (
            <div className="animate-in fade-in max-w-6xl mx-auto px-6 pt-6 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"><ArrowLeft size={20}/> Back</button>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <Filter size={16} className="text-slate-400 ml-2"/>
                        <select
                            value={diseaseFilter}
                            onChange={(e) => setDiseaseFilter(e.target.value)}
                            className="text-sm font-bold text-slate-700 outline-none bg-transparent pr-4"
                        >
                            {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedType} Dataset</h2>

                {loadingGallery ? (
                    <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Loading gallery...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400">No samples found.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredItems.map((item: any) => {
                            let slideDiagnosis = "Unspecified";
                            try { slideDiagnosis = JSON.parse(item.annotations).diagnosis || "Unspecified"; } catch(e) {}
                            return (
                                <div key={item.id} onClick={() => setViewingSample(item)} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group">
                                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                                        <img src={`http://localhost:8000${item.image_url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold shadow-lg">{item.box_count} Cells</div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">{slideDiagnosis}</h3>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">ID: RES-{item.id} • {item.date.split(" ")[0]}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {viewingSample && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div>
                                    <h2 className="font-bold text-slate-900 flex items-center gap-2"><Target size={18} className="text-red-500"/> {JSON.parse(viewingSample.annotations).diagnosis}</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">RES-{viewingSample.id} • Contributed by {viewingSample.contributor}</p>
                                </div>
                                <button onClick={() => setViewingSample(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                                    <div className="relative">
                                        <img src={`http://localhost:8000${viewingSample.image_url}`} className="max-h-[75vh] object-contain" />
                                        {JSON.parse(viewingSample.annotations).cells.map((box: any, idx: number) => (
                                            <div key={idx} className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}>
                                                <div className="absolute -top-5 left-0 bg-emerald-500 text-white text-[9px] px-1 rounded font-bold whitespace-nowrap">{box.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-72 bg-slate-50 border-l border-slate-100 p-6 overflow-y-auto">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Metadata</h4>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white rounded-xl border border-slate-200"><p className="text-xs font-bold text-slate-500 mb-1">Specimen</p><p className="text-sm font-bold">{viewingSample.type}</p></div>
                                        <div className="p-4 bg-white rounded-xl border border-slate-200"><p className="text-xs font-bold text-slate-500 mb-1">Notes</p><p className="text-xs text-slate-700 italic">"{viewingSample.notes || 'N/A'}"</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-20 bg-slate-50">
            {step === 0 && renderMainMenu()}
            {step === 1 && renderTypeSelection()}
            {step === 2 && mode === 'gallery' && renderGallery()}

            {step === 2 && mode === 'upload' && (
                <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in overflow-hidden">
                    <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => {setTool('pan'); setSelectedIndex(null);}} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold ${tool === 'pan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Move size={16} /> Pan Mode</button>
                            <button onClick={() => setTool('draw')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold ${tool === 'draw' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><MousePointer2 size={16} /> Label Mode</button>
                        </div>
                        <button onClick={handleUpload} disabled={uploading || !file || boxes.length === 0} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16}/>} Submit Contribution
                        </button>
                    </div>

                    <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center justify-center gap-10 text-[11px] font-bold uppercase tracking-wider text-blue-600 z-20">
                        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">1</div> Navigate: Pan & Scroll</div>
                        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</div> Identify: Label Cells</div>
                        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">3</div> Edit: Resize handles or Delete</div>
                    </div>

                    <div className="flex-1 flex overflow-hidden bg-slate-900">
                        <div className="flex-1 relative flex items-center justify-center">
                            {!previewUrl ? (
                                <label className="cursor-pointer flex flex-col items-center gap-4 text-slate-400 border-2 border-dashed border-slate-700 p-10 rounded-xl hover:border-slate-500 transition-colors">
                                    <UploadCloud size={64} /><span className="font-bold">Upload Slide Image</span>
                                    <input type="file" onChange={handleFileSelect} className="hidden" accept="image/*" />
                                </label>
                            ) : (
                                <div ref={containerRef} className="relative w-full h-full overflow-hidden"
                                     onWheel={(e) => { e.preventDefault(); updateZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1)); }}
                                     onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
                                     style={{ cursor: tool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
                                >
                                    <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} className="w-full h-full flex items-center justify-center pointer-events-none">
                                        <div className="relative pointer-events-auto">
                                            <img ref={imgRef} src={previewUrl} className="max-w-none pointer-events-none select-none shadow-2xl" style={{ maxHeight: '80vh' }} draggable={false}/>
                                            {boxes.map((box, i) => (
                                                <div key={i} onMouseDown={(e) => { e.stopPropagation(); setSelectedIndex(i); }}
                                                     className={`absolute border-2 z-10 transition-all ${selectedIndex === i ? 'border-blue-500 bg-blue-500/10' : 'border-green-500 bg-green-500/20'}`}
                                                     style={{left:`${box.x}%`, top:`${box.y}%`, width:`${box.w}%`, height:`${box.h}%`}}>
                                                    {(tool === 'pan' && selectedIndex === i) && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-30">{box.label}</div>}
                                                    {selectedIndex === i && tool === 'draw' && ['nw','ne','sw','se'].map(h => (
                                                        <div key={h} onMouseDown={(e) => { e.stopPropagation(); setResizeHandle(h); setIsDragging(true); }}
                                                             className={`absolute w-3 h-3 bg-white border border-blue-500 scale-[1/zoom] cursor-${h}-resize z-20 shadow-sm ${h==='nw'?'-top-1.5 -left-1.5':h==='ne'?'-top-1.5 -right-1.5':h==='sw'?'-bottom-1.5 -left-1.5':'-bottom-1.5 -right-1.5'}`}></div>
                                                    ))}
                                                </div>
                                            ))}
                                            {currentBox && <div className="absolute border-2 border-blue-500 bg-blue-500/20 z-20" style={{left:`${currentBox.x}%`, top:`${currentBox.y}%`, width:`${currentBox.w}%`, height:`${currentBox.h}%`}}></div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewUrl && (
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/10 z-30">
                                    <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                                        <button onClick={() => updateZoom(zoom - 0.1)} className="hover:text-blue-400 p-1 transition-colors"><ZoomOut size={18}/></button>
                                        <div className="flex items-center">
                                            <input type="text" value={manualZoom} onChange={(e) => setManualZoom(e.target.value)} onBlur={() => updateZoom(parseInt(manualZoom)/100)} className="w-12 bg-transparent text-center font-mono focus:outline-none focus:text-blue-400"/>
                                            <span className="text-white/50 text-xs">%</span>
                                        </div>
                                        <button onClick={() => updateZoom(zoom + 0.1)} className="hover:text-blue-400 p-1 transition-colors"><ZoomIn size={18}/></button>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">{tool === 'pan' ? 'Pannning View' : 'Resize Corners • Delete Box'}</div>
                                </div>
                            )}
                        </div>

                        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-lg overflow-y-auto">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Target size={14} className="text-red-500"/> Slide Classification</h3>
                                <button onClick={() => setIsChoosingDisease(true)} className="w-full p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-400 group transition-all text-left">
                                    <span className="font-bold text-slate-800 text-sm truncate pr-2">{selectedDisease}</span><ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0"/>
                                </button>
                            </div>
                            <div className="flex-1">
                                <div className="p-4 bg-white sticky top-0 z-10 border-b border-slate-50"><h3 className="text-xs font-bold text-slate-900 uppercase flex justify-between"><span>Live Cell Count</span><span className="text-blue-600">{boxes.length}</span></h3></div>
                                <div className="p-2 space-y-1">
                                    {Object.entries(getLabelCounts()).length === 0 ? <p className="text-[11px] text-slate-400 text-center py-10 px-4">Start labeling cells to see stats here.</p> :
                                        Object.entries(getLabelCounts()).map(([label, count]) => (
                                            <div key={label} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm">{count}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Researcher Notes</label>
                                <textarea className="w-full p-3 text-xs border border-slate-200 rounded-xl h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional context..." value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUCCESS MODAL --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} /></div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contribution Sent</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Your annotated slide has been successfully added to the research gallery.</p>
                            <button onClick={handleSuccessClose} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95">OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DISEASE MODAL --- */}
            {isChoosingDisease && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-900 p-4 text-white font-bold flex justify-between items-center tracking-wide">Select Slide Diagnosis <button onClick={() => {setIsChoosingDisease(false); setDiseaseCategory(null);}} className="hover:text-red-400 transition-colors"><X size={20}/></button></div>
                        <div className="p-2 h-[400px] overflow-y-auto custom-scrollbar">
                            {!diseaseCategory ? (
                                <>
                                    <button onClick={() => {setSelectedDisease("Normal / Unspecified"); setIsChoosingDisease(false);}} className="w-full text-left p-4 hover:bg-emerald-50 rounded-xl flex justify-between font-bold text-emerald-700 mb-2 border border-emerald-100 transition-colors"><span>Normal / No Abnormality</span><CheckCircle size={18}/></button>
                                    {Object.keys(DISEASE_TAXONOMY).map(cat => (
                                        <button key={cat} onClick={() => setDiseaseCategory(cat)} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl flex justify-between font-bold text-slate-700 transition-colors group">
                                            {cat}<ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500"/>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="p-2">
                                    <button onClick={() => setDiseaseCategory(null)} className="text-xs font-bold text-blue-600 mb-4 flex items-center gap-1 hover:underline"><ArrowLeft size={12}/> BACK TO CLASSES</button>
                                    {Object.keys(DISEASE_TAXONOMY[diseaseCategory]).map(sub => (
                                        <div key={sub} className="mb-6">
                                            <p className="font-bold text-slate-400 text-[10px] uppercase mb-2 tracking-widest border-b border-slate-50 pb-1">{sub}</p>
                                            <div className="grid grid-cols-1 gap-1">
                                                {DISEASE_TAXONOMY[diseaseCategory][sub].map((leaf: string) => (
                                                    <button key={leaf} onClick={() => {setSelectedDisease(`${sub}: ${leaf}`); setIsChoosingDisease(false); setDiseaseCategory(null);}} className="text-left p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-semibold border border-slate-100 transition-all">{leaf}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LABEL MODAL --- */}
            {isLabeling && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-900 p-4 text-white font-bold flex justify-between items-center tracking-wide">Label Cell <button onClick={() => setIsLabeling(false)} className="hover:text-red-400 transition-colors"><X size={20}/></button></div>
                        <div className="p-2 h-[400px] overflow-y-auto custom-scrollbar">
                            {!selectedCategory ? (
                                Object.keys(CELL_TAXONOMY).map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl flex justify-between font-bold text-slate-700 transition-colors group">
                                        {cat}<ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500"/>
                                    </button>
                                ))
                            ) : (
                                <div className="p-2">
                                    <button onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-blue-600 mb-4 flex items-center gap-1 hover:underline"><ArrowLeft size={12}/> BACK</button>
                                    {Object.keys(CELL_TAXONOMY[selectedCategory]).map(sub => (
                                        <div key={sub} className="mb-6"><p className="font-bold text-slate-400 text-[10px] uppercase mb-2 tracking-widest border-b border-slate-50 pb-1">{sub}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {CELL_TAXONOMY[selectedCategory][sub].map((leaf: string) => (
                                                    <button key={leaf} onClick={() => commitLabel(`${sub}: ${leaf}`)} className="text-left p-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded text-xs font-semibold border border-slate-100 transition-all">{leaf}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}