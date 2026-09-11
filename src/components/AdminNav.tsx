"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const TABS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/mesas", label: "Mesas" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/cuenta", label: "Cuenta" }
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function salir() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between gap-2 px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const activo = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`focus-visible-ring shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${
                activo ? "bg-basil text-white" : "bg-arena text-tinta/70"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <button onClick={salir} className="focus-visible-ring shrink-0 text-sm text-tinta/40 pl-2">
        Salir
      </button>
    </nav>
  );
}
