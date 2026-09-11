"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/ventas", label: "Ventas" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 px-4 pt-4">
      {TABS.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`focus-visible-ring px-4 py-2 rounded-full text-sm font-medium ${
              activo ? "bg-basil text-white" : "bg-arena text-tinta/70"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
