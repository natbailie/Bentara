"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Hash,
  FileText,
  Microscope,
  Clock,
  CheckCircle,
  FileBadge,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
/** * FIXED IMPORT: ensures we use the centralized API utility
 * that handles Cloud Auth and URLs correctly.
 */
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/config';

export default function PatientDetailsPage() {
  // useParams() can return a string or array. We force it to string for safety.
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New state to capture the EXACT error message from the backend
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      console.log(`Fetching details for ID: ${id}`); // Debug log for browser console

      /** * API CALL: Fetch specific patient by ID.
       * The try/catch block will catch 404s and 500s.
       */
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);
    } catch (err: any) {
      console.error("Error fetching patient details:", err);

      // Extract the specific error message to show on screen
      if (err.response) {
        // Server responded with a status code (e.g. 404, 500)
        setErrorMsg(`Server Error (${err.response.status}): ${err.response.data?.detail || "Unknown Backend Error"}`);
      } else if (err.request) {
        // Request was made but no response received
        setErrorMsg("Network Error: No response from server. Check your connection.");
      } else {
        // Something else happened
        setErrorMsg(`Client Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  if (loading) {
    return (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium text-black">Loading patient record...</p>
        </div>
    );
  }

  // --- ERROR VIEW ---
  if (errorMsg || !patient) {
    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Not Found</h2>
          <p className="text-slate-500 mb-6 font-mono bg-slate-50 inline-block px-3 py-1 rounded text-sm border border-slate-100">
            Debug Info: {errorMsg || "ID mismatch or deleted record"}
          </p>

          <div className="flex justify-center gap-4">
            <button onClick={() => router.back()} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Go Back
            </button>
            <button onClick={fetchDetails} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <RefreshCw size={18} /> Retry Connection
            </button>
          </div>
        </div>
    );
  }

  // --- MAIN CONTENT ---
  return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">

        {/* TOP NAV */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-4">
          <ArrowLeft size={16} /> Back to Directory
        </button>

        {/* HEADER CARD */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  patient.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
              }`}>{patient.gender}</span>
            </div>
            <p className="font-mono text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded text-sm font-bold">MRN: {patient.mrn}</p>
          </div>

          <div className="flex gap-8 text-sm text-slate-600">
            {/* DATE OF BIRTH */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Date of Birth</p>
                <p className="font-medium text-slate-900">{formatDate(patient.dob)}</p>
              </div>
            </div>

            {/* NHS NUMBER */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">NHS Number</p>
                <p className="font-mono font-bold text-slate-900 tracking-wide">{patient.nhs_number || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: HISTORY */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={16}/> Medical History
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                {patient.history || "No medical history notes recorded."}
              </p>
            </div>
          </div>

          {/* RIGHT: REPORTS LIST */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Microscope size={16}/> Diagnostic Reports
                </h3>
                <Link href={`/dashboard/upload/${patient.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                  + Upload New Slide
                </Link>
              </div>

              {!patient.reports || patient.reports.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">No slides uploaded for this patient yet.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                    {patient.reports.map((report: any) => (
                        <div key={report.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/50">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                            <img
                                /** FIXED: Uses getBaseUrl() utility to load the clinical image from the cloud. */
                                src={`${getBaseUrl()}${report.image_url}`}
                                className="w-full h-full object-cover"
                                alt="Slide preview"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {report.diagnosis}
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 ${
                                  report.status === 'Authorized' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {report.status === 'Authorized' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                                {report.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Detected with <span className="font-bold text-slate-700">{report.confidence} confidence</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2">
                              {report.date} • Assigned to {report.assigned_to || "System"}
                            </p>

                            {/* View Full Report Button */}
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <Link
                                  href={`/dashboard/report/${report.id}`}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <FileBadge size={14} /> View Full Report
                              </Link>
                            </div>

                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}