"use client";

import type { EstadoPedido } from "@/lib/types";

const FASES: { estado: EstadoPedido; label: string; mensaje: string }[] = [
  {
    estado: "recibido",
    label: "Recibido",
    mensaje: "Ya avisamos a la cocina, en breve empiezan a prepararlo."
  },
  {
    estado: "en_preparacion",
    label: "En preparación",
    mensaje: "Tu pedido se está cocinando ahora mismo."
  },
  {
    estado: "listo",
    label: "¡Listo!",
    mensaje: "Tu pedido ya está listo. En breve un camarero te lo llevará a tu mesa."
  },
  {
    estado: "entregado",
    label: "Entregado",
    mensaje: "¡Buen provecho!"
  }
];

export function OrderStatus({ estado, onNuevoPedido }: { estado: EstadoPedido; onNuevoPedido: () => void }) {
  const indiceActual = FASES.findIndex((f) => f.estado === estado);
  const faseActual = FASES[indiceActual] ?? FASES[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8 text-center">
      <div>
        <p className="text-tinta/50 mb-1">Tu pedido está en camino</p>
        <h1 className="font-display text-2xl mb-2">{faseActual.label}</h1>
        <p className="text-tinta/70 max-w-xs mx-auto">{faseActual.mensaje}</p>
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
