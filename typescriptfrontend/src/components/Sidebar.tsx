"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const path = usePathname() || "";

  const item = (href: string, label: string) => {
    const active = path.startsWith(href);
    return (
      <Link key={href} href={href} className={
        `block px-4 py-2 rounded-md font-medium transition ${
          active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
        }`
      }>
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-56 bg-white border-r p-5 flex flex-col">
      <div className="mb-8 flex flex-col items-center">
        <img src="/bentaralogo.jpg" className="w-16 mb-2" alt="Bentara logo" />
        <h2 className="text-sm font-semibold text-gray-700">Bentara Pathology</h2>
      </div>

      <nav className="space-y-2 flex-1">
        {item("/dashboard", "Dashboard")}
        {item("/patients", "Patients")}
        {item("/compare", "Compare")}
        {item("/chart", "Charts")}
        {item("/settings", "Settings")}
      </nav>

      <div className="text-xs text-gray-500 mt-6 text-center">Demo — not for clinical use</div>
    </aside>
  );
}
