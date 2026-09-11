"use client";

import type { Pedido } from "@/lib/types";

// Solo 2 acciones en el MVP, tal como pide el panel de cocina de 3 columnas.
// Pasar de "listo" a "entregado" queda para una futura pantalla de sala/caja.
const ACCION_POR_ESTADO: Record<string, { siguiente: string; etiqueta: string } | undefined> = {
  recibido: { siguiente: "en_preparacion", etiqueta: "Empezar" },
  en_preparacion: { siguiente: "listo", etiqueta: "Terminar" }
};

export function KanbanCard({ pedido, onCambiarEstado }: { pedido: Pedido; onCambiarEstado: (id: string, estado: string) => void }) {
  const hora = new Date(pedido.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const accion = ACCION_POR_ESTADO[pedido.estado];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-tinta/5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg">Mesa {pedido.mesas?.numero ?? "?"}</span>
        <span className="text-sm text-tinta/50">{hora}</span>
      </div>
      <ul className="text-sm flex flex-col gap-1">
        {pedido.items_pedido?.map((item) => (
          <li key={item.id}>
            <span className="font-medium">{item.cantidad}x</span> {item.nombre_producto}
          </li>
        ))}
      </ul>
      {accion && (
        <button
          onClick={() => onCambiarEstado(pedido.id, accion.siguiente)}
          className="focus-visible-ring mt-1 py-2 rounded-full bg-basil text-white font-semibold text-sm"
        >
          {accion.etiqueta}
        </button>
      )}
    </div>
  );
}
