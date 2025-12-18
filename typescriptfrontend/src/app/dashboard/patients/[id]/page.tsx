"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User, ArrowLeft, FileText, Activity, Microscope, Clock,
  Download, ImageIcon, ExternalLink, CheckCircle, ShieldAlert,
  BadgeCheck, UserCheck
} from 'lucide-react';
import { PatientService, getFileUrl } from '../../../../lib/api';

interface Patient {
  id: number;
  name: string;
  mrn: string;
  dob: string;
  sex: string;
  clinician: string;
  ward: string;
  indication: string;
}

interface Report {
  id: number;
  date: string;
  diagnosis: string;
  confidence: string;
  annotated_image: string;
  pdf_report: string;
  // NEW FIELDS
  status?: string;
  reviewer?: string;
  signed_off_date?: string;
}

export default function PatientChartPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id ? Number(params.id as string) : 0;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // User State for Permission Checking
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Load User
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    if (!id) return;

    const fetchData = async () => {
      try {
        const pRes = await PatientService.getOne(id);
        setPatient(pRes.data);

        try {
          const rRes = await PatientService.getReports(id);
          setReports(rRes.data.reports || []);
        } catch (e) { console.warn("No reports found"); }
      } catch (e) {
        console.error("Failed to load chart", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSignOff = async (reportId: number) => {
    if (!currentUser) return;
    const confirm = window.confirm(`Sign off report #${reportId} as ${currentUser.name}? This action cannot be undone.`);
    if (!confirm) return;

    try {
      await PatientService.signOff(reportId, currentUser.name);
      // Refresh local state
      setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: "Authorized", reviewer: currentUser.name, signed_off_date: new Date().toISOString().split('T')[0] } : r
      ));
    } catch (e) {
      alert("Failed to sign off report. Check connection.");
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Microscope className="animate-bounce text-blue-500" />
            <span>Loading Medical Record...</span>
          </div>
        </div>
    );
  }

  if (!patient) {
    return <div className="text-center p-10">Patient not found.</div>;
  }

  return (
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
            <p className="text-slate-500 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700 font-bold">MRN: {patient.mrn}</span>
              <span className="text-xs">•</span>
              <span className="text-xs font-medium">{patient.sex}</span>
              <span className="text-xs">•</span>
              <span className="text-xs">DOB: {patient.dob}</span>
            </p>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><User size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Current Location</p>
              <p className="font-bold text-slate-800 text-lg">{patient.ward || "Outpatient"}</p>
              <p className="text-xs text-slate-500 mt-1">Clinician: {patient.clinician || "Not Assigned"}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 md:col-span-2">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Activity size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Clinical Indication</p>
              <p className="text-slate-700 mt-1">{patient.indication || "No clinical notes provided."}</p>
            </div>
          </div>
        </div>

        {/* REPORTS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Microscope className="text-blue-600" size={18} />
              Pathology Reports
            </h3>
            <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">
            {reports.length} Records
          </span>
          </div>

          {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No reports generated yet.</p>
                <button onClick={() => router.push('/dashboard/upload')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                  Run New Analysis
                </button>
              </div>
          ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => {
                  const isAuthorized = report.status === "Authorized";
                  const isConsultant = currentUser?.details?.grade === "Consultant";

                  return (
                      <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors group flex flex-col md:flex-row gap-6 items-start">

                        {/* Status Badge - Left Side */}
                        <div className="w-full md:w-32 flex flex-col items-center justify-center h-24 bg-slate-50 rounded-lg border border-slate-100 gap-2">
                          {isAuthorized ? (
                              <>
                                <BadgeCheck className="text-emerald-500" size={32} />
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Authorized</span>
                              </>
                          ) : (
                              <>
                                <ShieldAlert className="text-amber-500" size={32} />
                                <span className="text-[10px] font-bold text-amber-600 uppercase">Pending</span>
                              </>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12} /> {report.date}
                                </span>
                            {isAuthorized && (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        • Signed by {report.reviewer}
                                    </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {report.diagnosis}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">AI Confidence Score: <span className="font-mono text-slate-700">{report.confidence}</span></p>

                          {/* CONSULTANT SIGN OFF AREA */}
                          {!isAuthorized && (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
                                <p className="text-xs text-amber-800 font-medium">Requires Consultant Verification</p>
                                {isConsultant ? (
                                    <button
                                        onClick={() => handleSignOff(report.id)}
                                        className="bg-amber-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-amber-700 flex items-center gap-2 shadow-sm"
                                    >
                                      <UserCheck size={14} /> Sign Off Report
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">Waiting for review...</span>
                                )}
                              </div>
                          )}
                        </div>

                        {/* ACTIONS: Separate PDF and Image Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                          <a href={getFileUrl(report.annotated_image)} target="_blank" className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                            <ImageIcon size={16} /> View Slide
                          </a>
                          <a href={getFileUrl(report.pdf_report)} target="_blank" className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                            <FileText size={16} /> Report PDF <ExternalLink size={12} className="opacity-50"/>
                          </a>
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>
  );
}