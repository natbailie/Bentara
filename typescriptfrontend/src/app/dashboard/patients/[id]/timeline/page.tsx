"use client";

import { useEffect, useState } from 'react';
/** * FIXED IMPORTS: Using the '@' alias to resolve the 'lib', 'components', and 'config' directories.
 * This ensures Vercel compatibility and handles cloud environment variables.
 */
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/config';
import PatientBanner from '@/components/PatientBanner';
import { Loader2, Calendar, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

export default function PatientTimeline({ params }: { params: { id: string } }) {
  const [events, setEvents] = useState<any[]>([]);
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimelineData = async () => {
      setLoading(true);
      try {
        /** * REPLACED: fetch(`http://127.0.0.1:8000/...`) with api.get
         * This automatically uses the cloud URL and adds your authorization token.
         */
        const patientRes = await api.get(`/patients/${params.id}`);
        setPatient(patientRes.data);

        const reportsRes = await api.get(`/reports/${params.id}`);
        const reportsList = reportsRes.data.reports || [];

        setEvents(reportsList.map((rep: any) => ({
          id: rep.id,
          date: rep.report_date,
          diagnosis: rep.diagnosis,
          /** * FIXED: Uses getBaseUrl() utility to load clinical files from the cloud
           * instead of a local machine.
           */
          pdf_url: `${getBaseUrl()}${rep.pdf_path}`,
          img_url: `${getBaseUrl()}${rep.annotated_image_path}`,
        })));
      } catch (err) {
        console.error("Failed to load timeline data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadTimelineData();
  }, [params.id]);

  if (loading) {
    return (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium text-black">Generating patient timeline...</p>
        </div>
    );
  }

  return (
      <div className="space-y-6 animate-in fade-in duration-500 text-black">
        <PatientBanner patient={patient} />

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Clinical Timeline</h3>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8">
            {events.length === 0 ? (
                <div className="text-slate-500 py-4 italic">No diagnostic events recorded for this patient history.</div>
            ) : (
                events.map((ev) => (
                    <div key={ev.id} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[41px] top-1 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-125"></div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-900">Diagnostic Report #{ev.id}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase">Verified</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mb-3">
                              {new Date(ev.date).toLocaleString('en-GB', {
                                dateStyle: 'full',
                                timeStyle: 'short'
                              })}
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100">
                              <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">AI Finding:</span>
                              <span className="text-sm font-bold text-blue-700">{ev.diagnosis}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full md:w-auto">
                            <a
                                href={ev.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all"
                            >
                              <FileText size={14} /> View PDF
                            </a>
                            <a
                                href={ev.img_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
                            >
                              <ImageIcon size={14} /> Full Image
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  );
}