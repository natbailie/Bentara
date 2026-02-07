"use client";

import { useEffect, useState } from 'react';
/** * FIXED IMPORTS: Using the '@' alias to resolve the 'lib', 'components', and 'config' directories.
 * This handles cloud environment variables and authentication automatically.
 */
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/config';
import PatientBanner from '@/components/PatientBanner';
import { UploadCloud, Loader2, CheckCircle, FileText, Image as ImageIcon, Microscope } from 'lucide-react';

export default function PatientUpload({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [result, setResult] = useState<any|null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(()=> {
    const loadPatient = async () => {
      try {
        /** * REPLACED: fetch(`http://127.0.0.1:8000/...`) with api.get
         * This ensures the patient data is fetched from the cloud backend.
         */
        const res = await api.get(`/patients/${params.id}`);
        setPatient(res.data);
      } catch (err) {
        console.error("Failed to load patient:", err);
      }
    };
    if (params.id) loadPatient();
  }, [params.id]);

  useEffect(()=> {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return ()=> URL.revokeObjectURL(url);
  }, [file]);

  async function doUpload() {
    if (!file) return alert('Please select a microscope image first.');
    setProcessing(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('patient_id', params.id);

    try {
      /** * REPLACED: Manual fetch('http://127.0.0.1:8000/upload') with api.post
       * This handles the Multipart/Form-Data headers and Auth token automatically.
       */
      const r = await api.post('/upload', fd);
      const data = r.data;

      /** * FIXED: Uses getBaseUrl() utility to point to clinical files on Hugging Face
       * instead of a local machine.
       */
      data.annotated_image_url = `${getBaseUrl()}${data.annotated_image}`;
      data.pdf_url = `${getBaseUrl()}${data.pdf}`;

      setResult(data);
      setPreview(data.annotated_image_url);
    } catch (e:any) {
      const errorMsg = e.response?.data?.detail || e.message || 'Analysis failed';
      alert('Upload failed: ' + errorMsg);
    } finally {
      setProcessing(false);
    }
  }

  return (
      <div className="space-y-6 animate-in fade-in duration-500 text-black">
        <PatientBanner patient={patient} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: UPLOAD CONTROLS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Microscope className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900">Specimen Info</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stain Type</label>
                <input className="w-full mt-1 border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" defaultValue="Wright" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Magnification</label>
                <input className="w-full mt-1 border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" defaultValue="100x" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slide Image</label>
                <div className="mt-1 flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                      <UploadCloud size={24} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-tighter">Click to select file</p>
                    </div>
                    <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <button
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                onClick={doUpload}
                disabled={processing || !file}
            >
              {processing ? <Loader2 className="animate-spin" /> : <UploadCloud size={20} />}
              {processing ? 'Analysing Slide...' : 'Upload & Analyse'}
            </button>
          </div>

          {/* RIGHT: PREVIEW & RESULTS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-slate-400" size={18} />
                {result ? 'AI Annotated View' : 'Image Preview'}
              </h3>

              {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-100">
                    <img src={preview} className="w-full shadow-inner" alt="Microscope view" />
                    {result && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <CheckCircle size={14} /> Analysis Complete
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="h-64 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={48} className="opacity-20 mb-2" />
                    <p className="text-sm font-medium">No image selected for analysis</p>
                  </div>
              )}

              {result && (
                  <div className="mt-6 p-5 bg-slate-900 rounded-2xl text-white shadow-xl animate-in zoom-in duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-blue-400">{result.diagnosis}</h4>
                        <p className="text-xs text-slate-400">Detection Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={result.pdf_url} target="_blank" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors" title="Download PDF Report">
                          <FileText size={20} />
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-white/10 pt-4">
                      <p className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Report stored securely in patient clinical history.
                      </p>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}