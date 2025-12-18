"use client";

import { useState, useEffect, useRef } from "react";
import { ResearchService, getFileUrl } from "../../../lib/api";
import {
    UploadCloud, Database, CheckCircle, X,
    MousePointer2, ChevronRight, ChevronLeft,
    Layers, Zap, Trash2, Maximize
} from "lucide-react";

// --- CONFIGURATION: DEEP HIERARCHY ---
type CellHierarchyType = {
    [category: string]: {
        [type: string]: string[] | null; // null means it's a direct list (like RBC)
    };
};

const CELL_DATA: CellHierarchyType = {
    "WBC": {
        "Neutrophil": ["Segmented (Normal)", "Band Form", "Hypersegmented", "Toxic Granulation", "Pelger-Huet", "Necrotic"],
        "Lymphocyte": ["Normal Lymphocyte", "Reactive (Atypical)", "Large Granular", "Prolymphocyte", "Smudge Cell", "Mott Cell"],
        "Monocyte": ["Normal Monocyte", "Vacuolated", "Promonocyte"],
        "Eosinophil": ["Normal Eosinophil", "Dysplastic"],
        "Basophil": ["Normal Basophil", "Dysplastic"],
        "Blast": ["Myeloblast", "Lymphoblast", "Monoblast", "Auer Rod +ve", "Undifferentiated"]
    },
    "RBC": {
        "Red Blood Cells": [
            "Normal RBC", "Anisocytosis", "Poikilocytosis", "Hypochromic", "Polychromatic",
            "Target Cell", "Sickle Cell", "Schistocyte", "Elliptocyte", "Teardrop",
            "Spherocyte", "Stomatocyte", "Acanthocyte", "Burr Cell", "Bite Cell",
            "Howell-Jolly Body", "Basophilic Stippling", "Pappenheimer Body",
            "Nucleated RBC", "Rouleaux", "Agglutination"
        ]
    },
    "PLT": {
        "Platelets": ["Normal Platelet", "Large/Giant Platelet", "Platelet Clump", "Hypogranular"]
    }
};

interface TrainingImage {
    id: number;
    filename: string;
    original_path: string;
    uploader: string;
    annotations: string;
    status: string;
}

interface Box {
    id: string; // Unique ID for selection
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    category: string;
}

export default function ResearchLab() {
    // Data
    const [images, setImages] = useState<TrainingImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<TrainingImage | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

    // Tool State
    const [activeCategory, setActiveCategory] = useState("WBC");
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null); // e.g., "Neutrophil"
    const [activeLabel, setActiveLabel] = useState("Segmented (Normal)");

    // Interaction State
    const [interactionMode, setInteractionMode] = useState<'draw' | 'resize' | 'move' | 'idle'>('idle');
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [activeBoxSnapshot, setActiveBoxSnapshot] = useState<Box | null>(null); // For resize/move calculations
    const [resizeHandle, setResizeHandle] = useState<string>(""); // "tl", "tr", "bl", "br"

    // Refs
    const imageRef = useRef<HTMLImageElement>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadImages(); }, []);

    // Keyboard: Delete & Numbers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === "Delete" || e.key === "Backspace") && selectedBoxId) {
                setBoxes(prev => prev.filter(b => b.id !== selectedBoxId));
                setSelectedBoxId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedBoxId]);

    const loadImages = async () => {
        try {
            const res = await ResearchService.getAll();
            setImages(res.data);
        } catch (e) { console.error(e); }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setLoading(true);
            const fd = new FormData();
            fd.append("file", e.target.files[0]);
            fd.append("uploader", "Researcher");
            await ResearchService.upload(fd);
            await loadImages();
            setLoading(false);
        }
    };

    const selectImage = (img: TrainingImage) => {
        setSelectedImage(img);
        setBoxes(JSON.parse(img.annotations || "[]"));
        setSelectedBoxId(null);
    };

    // --- HELPERS ---
    const getCoords = (e: React.MouseEvent) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const getColor = (cat: string) => {
        if (cat === "WBC") return "border-indigo-500 bg-indigo-500/20 text-indigo-600";
        if (cat === "RBC") return "border-rose-500 bg-rose-500/20 text-rose-600";
        return "border-emerald-500 bg-emerald-500/20 text-emerald-600";
    };

    // --- MOUSE INTERACTIONS ---

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!selectedImage) return;
        const { x, y } = getCoords(e);
        setStartPos({ x, y });

        // 1. Check if clicking a Resize Handle (only if box selected)
        if (selectedBoxId) {
            const handle = (e.target as HTMLElement).dataset.handle;
            if (handle) {
                setInteractionMode('resize');
                setResizeHandle(handle);
                const box = boxes.find(b => b.id === selectedBoxId);
                if (box) setActiveBoxSnapshot({ ...box });
                e.stopPropagation();
                return;
            }
        }

        // 2. Check if clicking an Existing Box (Move/Select)
        // We reverse boxes to check top-most first
        const clickedBoxIndex = [...boxes].reverse().findIndex(b =>
            x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
        );

        if (clickedBoxIndex !== -1) {
            // We found a box
            const realIndex = boxes.length - 1 - clickedBoxIndex;
            const clickedBox = boxes[realIndex];

            setSelectedBoxId(clickedBox.id);
            setActiveBoxSnapshot({ ...clickedBox });
            setInteractionMode('move');
            e.stopPropagation();
            return;
        }

        // 3. Otherwise: Start Drawing New Box
        setSelectedBoxId(null); // Deselect
        setInteractionMode('draw');
        const newId = Math.random().toString(36).substr(2, 9);
        setBoxes([...boxes, {
            id: newId, x, y, w: 0, h: 0,
            label: activeLabel, category: activeCategory
        }]);
        setSelectedBoxId(newId); // Immediately select the one we are drawing
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (interactionMode === 'idle') return;
        const { x, y } = getCoords(e);
        const dx = x - startPos.x;
        const dy = y - startPos.y;

        if (interactionMode === 'draw' && selectedBoxId) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                return {
                    ...b,
                    w: x - b.x, // Allow negative width during draw
                    h: y - b.y
                };
            }));
        }
        else if (interactionMode === 'move' && selectedBoxId && activeBoxSnapshot) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                return {
                    ...b,
                    x: activeBoxSnapshot.x + dx,
                    y: activeBoxSnapshot.y + dy
                };
            }));
        }
        else if (interactionMode === 'resize' && selectedBoxId && activeBoxSnapshot) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                let { x, y, w, h } = activeBoxSnapshot;

                if (resizeHandle.includes('r')) w += dx;
                if (resizeHandle.includes('l')) { x += dx; w -= dx; }
                if (resizeHandle.includes('b')) h += dy;
                if (resizeHandle.includes('t')) { y += dy; h -= dy; }

                return { ...b, x, y, w, h };
            }));
        }
    };

    const handleMouseUp = () => {
        // Normalize boxes (fix negative width/height)
        if (interactionMode === 'draw' && selectedBoxId) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                // If box is tiny, delete it (accidental click)
                if (Math.abs(b.w) < 1 || Math.abs(b.h) < 1) return null;
                return {
                    ...b,
                    x: b.w < 0 ? b.x + b.w : b.x,
                    y: b.h < 0 ? b.y + b.h : b.y,
                    w: Math.abs(b.w),
                    h: Math.abs(b.h)
                };
            }).filter(Boolean) as Box[]);
        }
        setInteractionMode('idle');
    };

    const saveWork = async () => {
        if (!selectedImage) return;
        await ResearchService.saveAnnotations(selectedImage.id, JSON.stringify(boxes), "Verified");
        alert("Saved Successfully!");
        loadImages();
    };

    // --- RENDERERS ---

    // Renders the sub-menu list (e.g. List of Neutrophil types)
    const renderLabelList = (list: string[], cat: string) => (
        <div className="space-y-1 mt-2 animate-in slide-in-from-right-4 duration-300">
            {list.map(label => (
                <button
                    key={label}
                    onClick={() => setActiveLabel(label)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all border flex items-center justify-between group ${
                        activeLabel === label
                            ? `bg-${cat === 'WBC' ? 'indigo' : cat === 'RBC' ? 'rose' : 'emerald'}-50 border-${cat === 'WBC' ? 'indigo' : cat === 'RBC' ? 'rose' : 'emerald'}-200 text-slate-900 font-bold`
                            : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                    }`}
                >
                    {label}
                    {activeLabel === label && <CheckCircle size={14} className="text-current"/>}
                </button>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1800px] mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4 px-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Database className="text-indigo-600" /> Research Station
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50">
                            <UploadCloud size={18} /> Upload Raw Image
                        </button>
                    </div>
                    <button onClick={saveWork} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg">
                        <CheckCircle size={18} /> Save Dataset
                    </button>
                </div>
            </div>

            <div className="flex gap-4 h-full overflow-hidden px-4 pb-4">

                {/* 1. DATASETS LIST */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
                        Work Queue
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {images.map(img => (
                            <div
                                key={img.id}
                                onClick={() => selectImage(img)}
                                className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 border transition-all ${selectedImage?.id === img.id ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-slate-50'}`}
                            >
                                <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                    <img src={getFileUrl(img.original_path)} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold truncate text-slate-800 w-32">{img.filename}</p>
                                    <p className={`text-[10px] font-bold uppercase ${img.status === 'Verified' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                        {img.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. MAIN CANVAS */}
                <div className="flex-1 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group select-none">
                    {selectedImage ? (
                        <div
                            className="relative"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img
                                ref={imageRef}
                                src={getFileUrl(selectedImage.original_path)}
                                className="max-h-[80vh] max-w-full shadow-2xl pointer-events-none"
                                draggable={false}
                            />

                            {boxes.map((box) => {
                                const isSelected = selectedBoxId === box.id;
                                const styleClass = getColor(box.category);
                                return (
                                    <div
                                        key={box.id}
                                        className={`absolute border-2 transition-opacity ${styleClass} ${isSelected ? 'z-50 border-yellow-400 bg-yellow-400/10' : 'z-10 hover:z-40'}`}
                                        style={{
                                            left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
                                            cursor: interactionMode === 'draw' ? 'crosshair' : 'move'
                                        }}
                                    >
                                        {/* Label Tag */}
                                        <span className={`absolute -top-6 left-0 text-[10px] px-2 py-0.5 rounded font-bold text-white shadow-sm whitespace-nowrap ${isSelected ? 'bg-yellow-500 text-black' : styleClass.replace('text-', 'bg-').split(' ')[0]}`}>
                                    {box.label}
                                </span>

                                        {/* RESIZE HANDLES (Only visible when selected) */}
                                        {isSelected && (
                                            <>
                                                <div data-handle="tl" className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-slate-400 cursor-nw-resize rounded-full shadow-sm hover:scale-125 transition-transform" />
                                                <div data-handle="tr" className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-slate-400 cursor-ne-resize rounded-full shadow-sm hover:scale-125 transition-transform" />
                                                <div data-handle="bl" className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-slate-400 cursor-sw-resize rounded-full shadow-sm hover:scale-125 transition-transform" />
                                                <div data-handle="br" className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-slate-400 cursor-se-resize rounded-full shadow-sm hover:scale-125 transition-transform" />

                                                {/* Quick Delete Button */}
                                                <button
                                                    onMouseDown={(e) => { e.stopPropagation(); setBoxes(boxes.filter(b => b.id !== box.id)); }}
                                                    className="absolute -top-8 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-slate-500 flex flex-col items-center">
                            <Layers size={64} className="mb-4 opacity-20" />
                            <p>Select a dataset to begin labeling</p>
                        </div>
                    )}
                </div>

                {/* 3. TOOLBOX (The "Slide Across" UI) */}
                <div className="w-80 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
                    {/* TABS */}
                    <div className="flex p-2 bg-slate-50 border-b border-slate-200 gap-1">
                        {["WBC", "RBC", "PLT"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setActiveSubMenu(null); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    activeCategory === cat
                                        ? `bg-white text-slate-900 shadow-sm border border-slate-200`
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {/* BREADCRUMB HEADER */}
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-800">
                            <MousePointer2 size={16} className="text-slate-400" />
                            {activeCategory === "WBC" && activeSubMenu ? (
                                <>
                                    <button onClick={() => setActiveSubMenu(null)} className="hover:underline">WBC</button>
                                    <ChevronRight size={14} className="text-slate-400" />
                                    <span className="text-indigo-600">{activeSubMenu}</span>
                                </>
                            ) : (
                                <span>{activeCategory === "WBC" ? "White Cells" : activeCategory === "RBC" ? "Red Cells" : "Platelets"}</span>
                            )}
                        </div>

                        {/* DYNAMIC CONTENT */}
                        {activeCategory === "WBC" ? (
                            !activeSubMenu ? (
                                // WBC ROOT MENU
                                <div className="space-y-2">
                                    {Object.keys(CELL_DATA["WBC"]).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setActiveSubMenu(type)}
                                            className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                        >
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-700">{type}</span>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                // WBC SUB-MENU (The "Slide Across" View)
                                <div>
                                    <button
                                        onClick={() => setActiveSubMenu(null)}
                                        className="mb-3 text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-slate-600"
                                    >
                                        <ChevronLeft size={12} /> Back to Categories
                                    </button>
                                    {renderLabelList(CELL_DATA["WBC"][activeSubMenu]!, "WBC")}
                                </div>
                            )
                        ) : (
                            // RBC & PLT (Direct List)
                            renderLabelList(CELL_DATA[activeCategory][activeCategory === "RBC" ? "Red Blood Cells" : "Platelets"]!, activeCategory)
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                        Click box to Select. Drag corners to Resize. Del to Remove.
                    </div>
                </div>

            </div>
        </div>
    );
}