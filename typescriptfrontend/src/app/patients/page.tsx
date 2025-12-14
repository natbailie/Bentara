"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [form, setForm] = useState({ name:'', dob:'', sex:'', nhs_number:''});
  const router = useRouter();

  async function doSearch() {
    if (!query) return;
    try {
      const r = await fetch(`${API_BASE}/patients/search?query=${encodeURIComponent(query)}`);
      if (!r.ok) throw new Error('search failed');
      const j = await r.json();
      setResults(j.patients || []);
    } catch (e) {
      alert('Search failed');
    }
  }

  async function createPatient() {
    if (!form.name) return alert('Name required');
    const r = await fetch(`${API_BASE}/patients/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
    if (!r.ok) return alert('Create failed');
    const j = await r.json();
    router.push(`/patients/${j.patient_id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Patients</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex gap-2">
          <input className="border p-2 rounded flex-1" placeholder="Search name or MRN" value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={doSearch}>Search</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="font-semibold mb-2">Create Patient</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input placeholder="Name" className="border p-2 rounded" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input placeholder="DOB" className="border p-2 rounded" value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})} />
          <input placeholder="Sex" className="border p-2 rounded" value={form.sex} onChange={e=>setForm({...form, sex:e.target.value})} />
          <input placeholder="NHS number" className="border p-2 rounded" value={form.nhs_number} onChange={e=>setForm({...form, nhs_number:e.target.value})} />
        </div>
        <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded" onClick={createPatient}>Create</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Results</h3>
        <ul className="space-y-2">
          {results.map(p=>(
            <li key={p.id}>
              <button onClick={()=>router.push(`/patients/${p.id}`)} className="text-blue-600">{p.name} — {p.nhs_number}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
