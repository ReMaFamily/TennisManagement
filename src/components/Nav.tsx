"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/logout-action";

const links = [
  { href: "/trenink", label: "Zápis tréninku" },
  { href: "/dochazka", label: "Docházka" },
  { href: "/admin", label: "Administrace" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/login") return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/trenink" className="font-semibold text-brand-700">
            🎾 Tenis trenér
          </Link>

          {/* Desktop / tablet nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <form action={logout}>
              <button type="submit" className="ml-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
                Odhlásit
              </button>
            </form>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 -mr-2 text-gray-600"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {open && (
          <nav className="sm:hidden pb-3 flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <form action={logout}>
              <button type="submit" className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
                Odhlásit
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
