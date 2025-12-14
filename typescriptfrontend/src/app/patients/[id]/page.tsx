"use client";
import { useEffect, useState } from 'react';
import PatientBanner from '@/components/PatientBanner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientOverview({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any|null>(null);
  useEffect(()=> {
    fetch(`http://127.0.0.1:8000/patients/${params.id}`).then(r=>r.ok ? r.json() : null).then(setPatient).catch(()=>setPatient(null));
  }, [params.id]);

  return (
    <div>
      <PatientBanner patient={patient} />

      <div className="flex gap-6">
        <div className="w-56 space-y-2">
          <Link href={`/patients/${params.id}`} className="block px-4 py-3 rounded bg-blue-50 text-blue-700">Overview</Link>
          <Link href={`/patients/${params.id}/upload`} className="block px-4 py-3 rounded border">Upload</Link>
          <Link href={`/patients/${params.id}/reports`} className="block px-4 py-3 rounded border">Reports</Link>
          <Link href={`/patients/${params.id}/timeline`} className="block px-4 py-3 rounded border">Timeline</Link>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Patient Details</h3>
            <pre className="text-sm mt-2">{JSON.stringify(patient || {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
