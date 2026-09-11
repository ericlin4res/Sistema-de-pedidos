"use client";

import type { Pedido } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";

const COLUMNAS: { estado: Pedido["estado"]; titulo: string; acento: string }[] = [
  { estado: "recibido", titulo: "Pedidos nuevos", acento: "border-t-brasa" },
  { estado: "en_preparacion", titulo: "En preparación", acento: "border-t-azafran" },
  { estado: "listo", titulo: "Completados", acento: "border-t-basil" }
];

export function KanbanBoard({ pedidos, onCambiarEstado }: { pedidos: Pedido[]; onCambiarEstado: (id: string, estado: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {COLUMNAS.map((col) => {
        const items = pedidos.filter((p) => p.estado === col.estado);
        return (
          <div key={col.estado} className={`bg-arena/60 rounded-2xl p-3 border-t-4 ${col.acento}`}>
            <h2 className="font-display text-lg mb-3 px-1">
              {col.titulo} <span className="text-tinta/40 text-sm">({items.length})</span>
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((pedido) => (
                <KanbanCard key={pedido.id} pedido={pedido} onCambiarEstado={onCambiarEstado} />
              ))}
              {items.length === 0 && <p className="text-tinta/30 text-sm px-1">Sin pedidos aquí</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
