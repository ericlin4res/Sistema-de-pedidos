"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Categoria, Producto } from "@/lib/types";

export function MenuList({
  productos,
  categorias,
  onAgregar
}: {
  productos: Producto[];
  categorias: Categoria[];
  onAgregar: (p: Producto) => void;
}) {
  const [categoriaActiva, setCategoriaActiva] = useState<string | "todas">("todas");

  const visibles = useMemo(() => {
    return productos
      .filter((p) => p.activo)
      .filter((p) => categoriaActiva === "todas" || p.categoria_id === categoriaActiva);
  }, [productos, categoriaActiva]);

  return (
    <div>
      {/* Filtros por categoría */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 sticky top-0 bg-crema/95 backdrop-blur z-10 border-b border-tinta/10">
        <FiltroChip
          activo={categoriaActiva === "todas"}
          onClick={() => setCategoriaActiva("todas")}
          label="Todo"
        />
        {categorias
          .sort((a, b) => a.orden - b.orden)
          .map((c) => (
            <FiltroChip
              key={c.id}
              activo={categoriaActiva === c.id}
              onClick={() => setCategoriaActiva(c.id)}
              label={c.nombre}
            />
          ))}
      </div>

      {/* Lista de productos */}
      <ul className="px-4 py-4 flex flex-col gap-4">
        {visibles.map((p) => (
          <li
            key={p.id}
            className="flex gap-3 bg-arena rounded-plato p-3 items-center"
          >
            <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-tinta/5">
              {p.foto_url && (
                <Image src={p.foto_url} alt={p.nombre} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg leading-snug text-tinta truncate">{p.nombre}</p>
              {p.descripcion && (
                <p className="text-sm text-tinta/60 line-clamp-2">{p.descripcion}</p>
              )}
              <p className="font-sans font-semibold text-basil mt-1">
                {p.precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </p>
            </div>
            <button
              disabled={p.agotado}
              onClick={() => onAgregar(p)}
              className="focus-visible-ring shrink-0 rounded-full w-11 h-11 flex items-center justify-center text-xl font-semibold text-white bg-basil disabled:bg-tinta/20 disabled:text-tinta/40"
              aria-label={`Añadir ${p.nombre} al pedido`}
            >
              {p.agotado ? "—" : "+"}
            </button>
          </li>
        ))}
        {visibles.length === 0 && (
          <p className="text-center text-tinta/50 py-10">No hay productos en esta categoría todavía.</p>
        )}
      </ul>
    </div>
  );
}

function FiltroChip({ activo, onClick, label }: { activo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`focus-visible-ring shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activo ? "bg-basil text-white" : "bg-arena text-tinta/70"
      }`}
    >
      {label}
    </button>
  );
}
