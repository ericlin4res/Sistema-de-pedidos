"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import { MesaCard } from "@/components/MesaCard";
import type { Mesa } from "@/lib/types";

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const res = await fetch("/api/mesas");
    const data = await res.json();
    setMesas(data.filter((m: Mesa) => m.activa));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregarMesa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreando(true);
    const res = await fetch("/api/mesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: parseInt(siguienteNumero, 10) })
    });
    setCreando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear la mesa");
      return;
    }
    setSiguienteNumero("");
    cargar();
  }

  async function quitarMesa(id: string) {
    if (!confirm("¿Quitar esta mesa? Ya no se podrá usar su QR para pedir.")) return;
    await fetch(`/api/mesas/${id}`, { method: "DELETE" });
    cargar();
  }

  const proximoNumeroSugerido = mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;

  return (
    <main className="min-h-screen pb-16 max-w-3xl mx-auto">
      <AdminNav />
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl mb-1">Mesas</h1>
        <p className="text-tinta/50 text-sm mb-4">
          Cada mesa tiene su propio código QR. Descárgalo e imprímelo para ponerlo en la mesa.
        </p>

        <form onSubmit={agregarMesa} className="flex gap-2 mb-6">
          <input
            required
            type="number"
            min="1"
            placeholder={`Número (sugerido: ${proximoNumeroSugerido})`}
            value={siguienteNumero}
            onChange={(e) => setSiguienteNumero(e.target.value)}
            className="flex-1 border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
          />
          <button
            disabled={creando}
            className="focus-visible-ring px-5 py-2 rounded-full bg-basil text-white font-semibold text-sm disabled:opacity-50"
          >
            {creando ? "Creando…" : "+ Añadir mesa"}
          </button>
        </form>
        {error && <p className="text-brasa text-sm mb-4">{error}</p>}

        {cargando && <p className="text-tinta/40 text-center py-10">Cargando mesas…</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {mesas
            .sort((a, b) => a.numero - b.numero)
            .map((mesa) => (
              <MesaCard key={mesa.id} mesa={mesa} onDesactivar={quitarMesa} />
            ))}
        </div>

        {!cargando && mesas.length === 0 && (
          <p className="text-tinta/40 text-center py-10">Todavía no has añadido ninguna mesa.</p>
        )}
      </div>
    </main>
  );
}
