"use client";

import Image from "next/image";
import type { Producto } from "@/lib/types";

export function ProductTable({
  productos,
  onEditar,
  onEliminar,
  onToggleAgotado
}: {
  productos: Producto[];
  onEditar: (p: Producto) => void;
  onEliminar: (id: string) => void;
  onToggleAgotado: (p: Producto) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {productos.map((p) => (
        <div key={p.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-tinta/5">
          <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-tinta/5">
            {p.foto_url && <Image src={p.foto_url} alt={p.nombre} fill sizes="56px" className="object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.nombre}</p>
            <p className="text-sm text-tinta/50">
              {p.precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </p>
          </div>
          <button
            onClick={() => onToggleAgotado(p)}
            className={`focus-visible-ring text-xs px-3 py-1.5 rounded-full font-medium ${
              p.agotado ? "bg-brasa/15 text-brasa" : "bg-basil/15 text-basil"
            }`}
          >
            {p.agotado ? "Agotado" : "Disponible"}
          </button>
          <button onClick={() => onEditar(p)} className="focus-visible-ring text-sm text-tinta/60 px-2">
            Editar
          </button>
          <button onClick={() => onEliminar(p.id)} className="focus-visible-ring text-sm text-brasa px-2">
            Eliminar
          </button>
        </div>
      ))}
      {productos.length === 0 && <p className="text-center text-tinta/40 py-8">Aún no hay productos.</p>}
    </div>
  );
}
