"use client";
export default function PatientBanner({ patient }: { patient: any }) {
  if (!patient) return null;
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{patient.name || "Unknown Patient"}</div>
          <div className="text-sm text-gray-600">
            MRN: <span className="font-medium">{patient.mrn || "—"}</span> • DOB: <span className="font-medium">{patient.dob || "—"}</span>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="text-xs text-gray-500">
            <div><strong>Clinician</strong></div>
            <div className="font-medium">{patient.clinician || "—"}</div>
          </div>

          <div className="text-xs text-gray-500">
            <div><strong>Specimen</strong></div>
            <div className="font-medium">{patient.stain || "Unknown"}</div>
          </div>

          <div className="text-xs text-gray-500">
            <div><strong>Zoom</strong></div>
            <div className="font-medium">{patient.zoom || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
