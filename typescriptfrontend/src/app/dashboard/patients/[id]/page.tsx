"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Hash, // Used for NHS Number
  FileText,
  Microscope,
  Clock,
  CheckCircle,
  FileBadge
} from 'lucide-react';

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/patients/${params.id}`);
        if (!res.ok) throw new Error("Patient not found");
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchDetails();
  }, [params.id]);

  if (loading) return <div className="p-10 text-slate-400">Loading patient record...</div>;
  if (!patient) return <div className="p-10 text-red-400">Patient not found.</div>;

  return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

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

            {/* NHS NUMBER (Replaced Contact) */}
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
                <Link href="/dashboard/upload" className="text-xs font-bold text-blue-600 hover:underline">
                  + Upload New Slide
                </Link>
              </div>

              {patient.reports.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">No slides uploaded for this patient yet.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                    {patient.reports.map((report: any) => (
                        <div key={report.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/50">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                            <img src={`http://localhost:8000${report.image_url}`} className="w-full h-full object-cover" />
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