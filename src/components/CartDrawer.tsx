"use client";

import { useState } from "react";
import type { ItemCarrito } from "@/lib/types";

export function CartDrawer({
  abierto,
  onCerrar,
  items,
  total,
  onCambiarCantidad,
  onQuitar,
  onRevisar,
  onEnviarPedido,
  confirmando,
  error
}: {
  abierto: boolean;
  onCerrar: () => void;
  items: ItemCarrito[];
  total: number;
  onCambiarCantidad: (id: string, cantidad: number) => void;
  onQuitar: (id: string) => void;
  onRevisar: () => Promise<{ resumen: string } | null>;
  onEnviarPedido: () => Promise<void>;
  confirmando: boolean;
  error?: string | null;
}) {
  const [resumen, setResumen] = useState<string | null>(null);
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);

  if (!abierto) return null;

  const formatear = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  async function pedirResumen() {
    setPidiendoConfirmacion(true);
    const r = await onRevisar();
    setPidiendoConfirmacion(false);
    if (r) setResumen(r.resumen);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end">
      <div className="absolute inset-0 bg-tinta/40" onClick={onCerrar} />
      <div className="relative w-full bg-crema rounded-t-plato max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-tinta/10 flex items-center justify-between">
          <h2 className="font-display text-xl">Tu pedido</h2>
          <button onClick={onCerrar} className="focus-visible-ring text-tinta/50 text-sm">Cerrar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 && <p className="text-tinta/50 text-center py-8">Aún no has añadido nada.</p>}

          {!resumen &&
            items.map((item) => (
              <div key={item.producto_id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.nombre}</p>
                  <p className="text-sm text-tinta/60">{formatear(item.precio)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="focus-visible-ring w-8 h-8 rounded-full bg-arena text-lg"
                    onClick={() => onCambiarCantidad(item.producto_id, item.cantidad - 1)}
                    aria-label="Quitar una unidad"
                  >
                    −
                  </button>
                  <span className="w-5 text-center">{item.cantidad}</span>
                  <button
                    className="focus-visible-ring w-8 h-8 rounded-full bg-arena text-lg"
                    onClick={() => onCambiarCantidad(item.producto_id, item.cantidad + 1)}
                    aria-label="Añadir una unidad"
                  >
                    +
                  </button>
                </div>
                <button
                  className="focus-visible-ring text-brasa text-sm ml-1"
                  onClick={() => onQuitar(item.producto_id)}
                >
                  Quitar
                </button>
              </div>
            ))}

          {/* Una vez la IA confirmó el pedido, se muestra solo de lectura.
              La única forma de cambiarlo es tocando "Editar", que vuelve a
              habilitar la lista de arriba y borra este resumen. */}
          {resumen && (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.producto_id} className="flex items-center justify-between text-sm">
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span className="text-tinta/60">{formatear(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {resumen && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-azafran/20 text-sm text-tinta">
            <p className="font-semibold mb-1">Antes de enviarlo a cocina, revisa:</p>
            <p className="whitespace-pre-line">{resumen}</p>
          </div>
        )}

        {error && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-brasa/15 text-sm text-brasa">
            {error}
          </div>
        )}

        <div className="p-4 border-t border-tinta/10 bg-crema">
          <div className="flex justify-between mb-3 font-display text-lg">
            <span>Total</span>
            <span>{formatear(total)}</span>
          </div>
          {!resumen ? (
            <button
              disabled={items.length === 0 || pidiendoConfirmacion}
              onClick={pedirResumen}
              className="focus-visible-ring w-full py-3 rounded-full bg-basil text-white font-semibold disabled:opacity-40"
            >
              {pidiendoConfirmacion ? "Revisando…" : "Revisar pedido"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setResumen(null)}
                className="focus-visible-ring flex-1 py-3 rounded-full bg-arena text-tinta font-semibold"
              >
                Editar pedido
              </button>
              <button
                disabled={confirmando}
                onClick={onEnviarPedido}
                className="focus-visible-ring flex-1 py-3 rounded-full bg-basil text-white font-semibold disabled:opacity-40"
              >
                {confirmando ? "Enviando…" : "Sí, es correcto"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
