// src/app/dashboard/register/page.tsx
import PatientCreate from "../../../components/PatientCreate";

export default function RegisterPage() {
    return (
        <div className="space-y-6">
            {/* The component handles its own header, so we just drop it in */}
            <PatientCreate />
        </div>
    );
}