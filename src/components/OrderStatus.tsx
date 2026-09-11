"use client";

import type { EstadoPedido } from "@/lib/types";

const FASES: { estado: EstadoPedido; label: string }[] = [
  { estado: "recibido", label: "Recibido" },
  { estado: "en_preparacion", label: "En preparación" },
  { estado: "listo", label: "Listo" },
  { estado: "entregado", label: "Entregado" }
];

export function OrderStatus({ estado, onNuevoPedido }: { estado: EstadoPedido; onNuevoPedido: () => void }) {
  const indiceActual = FASES.findIndex((f) => f.estado === estado);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8 text-center">
      <div>
        <p className="text-tinta/50 mb-1">Tu pedido está en camino</p>
        <h1 className="font-display text-2xl">{FASES[indiceActual]?.label ?? "Recibido"}</h1>
      </div>

      <ol className="w-full max-w-xs flex flex-col gap-4">
        {FASES.map((fase, i) => {
          const completado = i <= indiceActual;
          return (
            <li key={fase.estado} className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  completado ? "bg-basil" : "bg-tinta/15"
                }`}
              />
              <span className={completado ? "text-tinta font-medium" : "text-tinta/40"}>
                {fase.label}
              </span>
            </li>
          );
        })}
      </ol>

      {estado === "entregado" && (
        <button
          onClick={onNuevoPedido}
          className="focus-visible-ring px-6 py-3 rounded-full bg-basil text-white font-semibold"
        >
          Hacer otro pedido
        </button>
      )}
    </div>
  );
}
