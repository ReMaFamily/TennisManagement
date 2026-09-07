import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/sverenci", label: "Svěřenci" },
  { href: "/admin/jednotky", label: "Tréninkové jednotky" },
  { href: "/admin/export", label: "Export do Excelu" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Administrace</h1>
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-gray-50 rounded-t-lg"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
