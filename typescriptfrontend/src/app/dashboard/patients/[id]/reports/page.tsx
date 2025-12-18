"use client";
import { useEffect, useState } from 'react';
import PatientBanner from '@/components/PatientBanner';

export default function PatientReports({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any|null>(null);
  const [reports, setReports] = useState<any[]>([]);
  useEffect(()=> {
    fetch(`http://127.0.0.1:8000/patients/${params.id}`).then(r=>r.ok? r.json():null).then(setPatient).catch(()=>setPatient(null));
    fetch(`http://127.0.0.1:8000/reports/${params.id}`).then(r=>r.ok? r.json():{reports:[]}).then(j=>{
      setReports((j.reports||[]).map((rep:any)=>({
        ...rep,
        pdf_url: `http://127.0.0.1:8000/${rep.pdf_path}`,
        img_url: `http://127.0.0.1:8000/${rep.annotated_image_path}`,
      })));
    }).catch(()=>setReports([]));
  }, [params.id]);

  return (
    <div>
      <PatientBanner patient={patient} />
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Reports</h3>
        {reports.length===0 ? <div className="text-gray-600">No reports</div> : (
          <div className="space-y-3">
            {reports.map(r=>(
              <div key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <div className="font-semibold">Report #{r.id}</div>
                  <div className="text-sm text-gray-500">{new Date(r.report_date).toLocaleString()}</div>
                  <div className="text-sm mt-1">Diagnosis: {r.diagnosis}</div>
                </div>
                <div className="flex gap-2">
                  <a className="px-3 py-2 bg-green-600 text-white rounded" href={r.pdf_url} target="_blank">PDF</a>
                  <a className="px-3 py-2 bg-blue-600 text-white rounded" href={r.img_url} target="_blank">Image</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
