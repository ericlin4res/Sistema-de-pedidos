"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useRealtimeOrders, usePedidosDeliveryEnviados } from "@/hooks/useRealtimeOrders";
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
    <main className="min-h-screen pb-16">
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

      <KanbanBoard pedidos={pedidosFiltrados} onCambiarEstado={cambiarEstado} />

      {tipo === "delivery" && <PedidosEnviados />}
    </main>
  );
}

function PedidosEnviados() {
  const { pedidos, cargando } = usePedidosDeliveryEnviados();

  return (
    <section className="px-4 mt-4">
      <h2 className="font-display text-lg mb-3">Pedidos enviados</h2>

      {cargando && <p className="text-tinta/40 text-sm">Cargando…</p>}

      {!cargando && pedidos.length === 0 && (
        <p className="text-tinta/40 text-sm py-6">
          Todavía no hay pedidos delivery enviados. En cuanto la app de repartidores esté
          lista, aparecerán aquí con el nombre del cliente, su pedido y la dirección.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-arena rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{pedido.nombre_cliente ?? "Cliente sin nombre"}</p>
              <span className="text-xs text-tinta/50">
                {new Date(pedido.created_at).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <ul className="text-sm mb-2">
              {pedido.items_pedido?.map((item) => (
                <li key={item.id}>
                  {item.cantidad}x {item.nombre_producto}
                </li>
              ))}
            </ul>
            <p className="text-sm text-tinta/60">📍 {pedido.direccion_envio ?? "Sin dirección registrada"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
