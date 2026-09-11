"use client";

import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function CocinaPage() {
  const { pedidos, cargando, recargar } = useRealtimeOrders();

  async function cambiarEstado(id: string, estado: string) {
    // Actualización optimista simple: recargamos tras confirmar en servidor.
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado })
    });
    recargar();
  }

  return (
    <main className="min-h-screen">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl">Cocina</h1>
        <span className="text-sm text-tinta/40">{cargando ? "Cargando…" : "En vivo"}</span>
      </header>
      <KanbanBoard pedidos={pedidos} onCambiarEstado={cambiarEstado} />
    </main>
  );
}
