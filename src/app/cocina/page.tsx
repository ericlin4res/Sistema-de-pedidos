"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { TipoPedido } from "@/lib/types";

export default function CocinaPage() {
  const { pedidos, cargando, recargar } = useRealtimeOrders();
  const [tipo, setTipo] = useState<TipoPedido>("local");
  const router = useRouter();
  const supabase = createClient();

  async function salir() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function cambiarEstado(id: string, estado: string) {
    // Actualización optimista simple: recargamos tras confirmar en servidor.
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado })
    });
    recargar();
  }

  const pedidosFiltrados = pedidos.filter((p) => p.tipo_pedido === tipo);

  return (
    <main className="min-h-screen">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl">Cocina</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tinta/40">{cargando ? "Cargando…" : "En vivo"}</span>
          <button onClick={salir} className="focus-visible-ring text-sm text-tinta/40">
            Salir
          </button>
        </div>
      </header>

      <div className="flex gap-2 px-4 pb-2">
        <button
          onClick={() => setTipo("local")}
          className={`focus-visible-ring px-4 py-2 rounded-full text-sm font-medium ${
            tipo === "local" ? "bg-basil text-white" : "bg-arena text-tinta/70"
          }`}
        >
          Pedidos del Local
        </button>
        <button
          onClick={() => setTipo("delivery")}
          className={`focus-visible-ring px-4 py-2 rounded-full text-sm font-medium ${
            tipo === "delivery" ? "bg-basil text-white" : "bg-arena text-tinta/70"
          }`}
        >
          Pedidos Delivery
        </button>
      </div>

      {tipo === "delivery" && pedidosFiltrados.length === 0 ? (
        <p className="text-center text-tinta/40 px-6 py-16">
          Todavía no hay pedidos por delivery. Esta sección quedará lista para conectarse
          con la futura app de repartidores.
        </p>
      ) : (
        <KanbanBoard pedidos={pedidosFiltrados} onCambiarEstado={cambiarEstado} />
      )}
    </main>
  );
}
