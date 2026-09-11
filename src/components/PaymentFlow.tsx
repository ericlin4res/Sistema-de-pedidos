"use client";

import { useState } from "react";
import type { MetodoPago } from "@/lib/types";

type Vista = "metodo" | "confirmar_efectivo" | "info_tarjeta";

export function PaymentFlow({
  total,
  onConfirmarEfectivo,
  procesando
}: {
  total: number;
  onConfirmarEfectivo: () => Promise<void>;
  procesando: boolean;
}) {
  const [vista, setVista] = useState<Vista>("metodo");

  const formatear = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  function elegir(metodo: MetodoPago) {
    setVista(metodo === "efectivo" ? "confirmar_efectivo" : "info_tarjeta");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div>
        <p className="text-tinta/50 mb-1">Tu pedido fue entregado</p>
        <h1 className="font-display text-2xl">¿Cómo deseas pagar?</h1>
      </div>

      {vista === "metodo" && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={() => elegir("efectivo")}
            className="focus-visible-ring py-4 rounded-full bg-basil text-white font-semibold"
          >
            Efectivo
          </button>
          <button
            onClick={() => elegir("tarjeta")}
            className="focus-visible-ring py-4 rounded-full bg-arena text-tinta font-semibold border border-tinta/10"
          >
            Tarjeta
          </button>
        </div>
      )}

      {vista === "confirmar_efectivo" && (
        <div className="w-full max-w-xs flex flex-col gap-4">
          <div className="bg-arena rounded-2xl p-5">
            <p className="text-tinta/60 text-sm mb-1">Total a pagar en efectivo</p>
            <p className="font-display text-3xl">{formatear(total)}</p>
          </div>
          <p className="text-sm text-tinta/50">
            Entrega el efectivo a tu camarero y confirma aquí cuando esté listo.
          </p>
          <button
            disabled={procesando}
            onClick={onConfirmarEfectivo}
            className="focus-visible-ring py-4 rounded-full bg-basil text-white font-semibold disabled:opacity-50"
          >
            {procesando ? "Confirmando…" : "Aceptar"}
          </button>
          <button
            onClick={() => setVista("metodo")}
            className="focus-visible-ring text-sm text-tinta/50"
          >
            Volver
          </button>
        </div>
      )}

      {vista === "info_tarjeta" && (
        <div className="w-full max-w-xs flex flex-col gap-4">
          <div className="bg-azafran/20 rounded-2xl p-5 text-sm text-tinta">
            El pago con tarjeta estará disponible muy pronto. Por ahora, pídele a tu
            camarero que te cobre en efectivo o con el datáfono del restaurante.
          </div>
          <button
            onClick={() => setVista("metodo")}
            className="focus-visible-ring py-3 rounded-full bg-arena text-tinta font-semibold"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
