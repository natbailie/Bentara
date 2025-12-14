"use client";
import { useEffect, useState } from 'react';
import PatientBanner from '@/components/PatientBanner';

export default function PatientTimeline({ params }: { params: { id: string } }) {
  const [events, setEvents] = useState<any[]>([]);
  const [patient, setPatient] = useState<any|null>(null);

  useEffect(()=> {
    fetch(`http://127.0.0.1:8000/patients/${params.id}`).then(r=>r.ok? r.json():null).then(setPatient).catch(()=>setPatient(null));
    fetch(`http://127.0.0.1:8000/reports/${params.id}`).then(r=>r.ok? r.json():{reports:[]}).then(j=>{
      setEvents((j.reports||[]).map((rep:any)=>({
        id: rep.id,
        date: rep.report_date,
        diagnosis: rep.diagnosis,
        pdf_url: `http://127.0.0.1:8000/${rep.pdf_path}`,
        img_url: `http://127.0.0.1:8000/${rep.annotated_image_path}`,
      })));
    }).catch(()=>setEvents([]));
  }, [params.id]);

  return (
    <div>
      <PatientBanner patient={patient} />
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">Timeline</h3>
        <div className="relative border-l-2 border-gray-200 pl-6">
          {events.length===0 && <div className="text-gray-600">No events</div>}
          {events.map(ev=>(
            <div key={ev.id} className="mb-6 relative">
              <div className="absolute -left-3 top-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white"></div>
              <div className="bg-gray-50 p-3 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">Report #{ev.id}</div>
                    <div className="text-sm text-gray-500">{new Date(ev.date).toLocaleString()}</div>
                    <div className="text-sm mt-1">Diagnosis: {ev.diagnosis}</div>
                  </div>
                  <div className="flex gap-2">
                    <a className="px-3 py-1 bg-green-600 text-white rounded" href={ev.pdf_url} target="_blank">PDF</a>
                    <a className="px-3 py-1 bg-blue-600 text-white rounded" href={ev.img_url} target="_blank">Image</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
