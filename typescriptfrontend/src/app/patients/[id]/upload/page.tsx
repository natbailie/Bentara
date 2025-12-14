"use client";
import { useEffect, useState } from 'react';
import PatientBanner from '@/components/PatientBanner';

export default function PatientUpload({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [result, setResult] = useState<any|null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(()=> {
    fetch(`http://127.0.0.1:8000/patients/${params.id}`).then(r=>r.ok? r.json():null).then(setPatient).catch(()=>setPatient(null));
  }, [params.id]);

  useEffect(()=> {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return ()=> URL.revokeObjectURL(url);
  }, [file]);

  async function doUpload() {
    if (!file) return alert('Select an image');
    setProcessing(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('patient_id', params.id);
    try {
      const r = await fetch('http://127.0.0.1:8000/upload', { method:'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      j.annotated_image_url = `http://127.0.0.1:8000/${j.annotated_image}`;
      j.pdf_url = `http://127.0.0.1:8000/${j.pdf}`;
      setResult(j);
      setPreview(j.annotated_image_url);
    } catch (e:any) {
      alert('Upload failed: ' + (e.message || e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <PatientBanner patient={patient} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Specimen Info</h3>
          <label className="text-sm text-gray-600">Stain</label>
          <input className="border p-2 rounded w-full mb-2" defaultValue="Wright" />
          <label className="text-sm text-gray-600">Zoom</label>
          <input className="border p-2 rounded w-full mb-2" defaultValue="100x" />
          <label className="text-sm text-gray-600">Clinician</label>
          <input className="border p-2 rounded w-full mb-2" />
          <label className="text-sm text-gray-600">Image</label>
          <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="mb-2" />
          <button className="w-full bg-blue-600 text-white py-2 rounded" onClick={doUpload} disabled={processing}>{processing ? 'Analysing...' : 'Upload & Analyse'}</button>
        </div>

        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Preview / Annotated</h3>
          {preview ? <img src={preview} className="w-full rounded" /> : <div className="h-64 bg-gray-50 flex items-center justify-center text-gray-400">No image</div>}
          {result && <pre className="mt-3 bg-gray-50 p-3 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}
