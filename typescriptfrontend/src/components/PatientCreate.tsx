// src/components/PatientCreate.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../api';

export default function PatientCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        sex: 'Male',
        mrn: '',
        nhs_number: '',
        clinician: '',
        ward: '',
        sample_date: new Date().toISOString().split('T')[0], // Default to today
        indication: '',
        stain: 'Giemsa',
        zoom: '40x'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await PatientService.create(formData);
            // On success, redirect to the new patient's dashboard
            navigate(`/patient/${res.data.patient_id}`);
        } catch (error) {
            alert("Error creating patient. Please check the console.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Register New Patient</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Width Name */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input required name="name" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>

                {/* IDs */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">MRN (Hospital ID)</label>
                    <input name="mrn" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">NHS Number</label>
                    <input name="nhs_number" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>

                {/* Demographics */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input type="date" name="dob" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sex</label>
                    <select name="sex" onChange={handleChange} className="mt-1 block w-full p-2 border rounded">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>

                {/* Clinical Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Clinician</label>
                    <input name="clinician" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ward / Location</label>
                    <input name="ward" onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>

                {/* Sample Details */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stain Type</label>
                    <select name="stain" onChange={handleChange} className="mt-1 block w-full p-2 border rounded">
                        <option>Giemsa</option>
                        <option>Wright-Giemsa</option>
                        <option>H&E</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Zoom Level</label>
                    <select name="zoom" onChange={handleChange} className="mt-1 block w-full p-2 border rounded">
                        <option>40x</option>
                        <option>100x</option>
                        <option>10x</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Sample Date</label>
                    <input type="date" name="sample_date" value={formData.sample_date} onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Indication / Notes</label>
                    <textarea name="indication" rows={3} onChange={handleChange} className="mt-1 block w-full p-2 border rounded"></textarea>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-bold transition-colors"
                    >
                        {loading ? 'Registering...' : 'Create Patient Record'}
                    </button>
                </div>
            </form>
        </div>
    );
}