"use client";

import { useEffect, useState } from 'react';
/** * FIXED IMPORTS: Using the '@' alias to resolve the 'lib' and 'components' directories.
 * This handles cloud URLs and image pathing automatically.
 */
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/config';
import PatientBanner from '@/components/PatientBanner';
import { Loader2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

export default function PatientReports({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        /** * REPLACED: fetch(`http://127.0.0.1:8000/...`) with api.get
         * This automatically uses the cloud URL and adds your authorization token.
         */
        const patientRes = await api.get(`/patients/${params.id}`);
        setPatient(patientRes.data);

        const reportsRes = await api.get(`/reports/${params.id}`);
        const reportsList = reportsRes.data.reports || [];

        setReports(reportsList.map((rep: any) => ({
          ...rep,
          /** * FIXED: Uses getBaseUrl() utility to load clinical files from the cloud
           * instead of a local machine.
           */
          pdf_url: `${getBaseUrl()}${rep.pdf_path}`,
          img_url: `${getBaseUrl()}${rep.annotated_image_path}`,
        })));
      } catch (err) {
        console.error("Failed to load patient reports:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadData();
  }, [params.id]);

  if (loading) {
    return (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium text-black">Loading diagnostic history...</p>
        </div>
    );
  }

  return (
      <div className="space-y-6 animate-in fade-in duration-500 text-black">
        <PatientBanner patient={patient} />

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Diagnostic Reports</h3>
          </div>

          {reports.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No reports generated for this patient.</p>
              </div>
          ) : (
              <div className="space-y-4">
                {reports.map((r) => (
                    <div key={r.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-blue-200 transition-all gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Report #{r.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">Authorized</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {new Date(r.report_date).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 mt-2 flex items-center gap-2">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Diagnosis:</span>
                          {r.diagnosis}
                        </div>
                      </div>

                      <div className="flex gap-3 w-full md:w-auto">
                        <a
                            href={r.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all"
                        >
                          <FileText size={16} /> PDF
                        </a>
                        <a
                            href={r.img_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          <ImageIcon size={16} /> View Image
                        </a>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}