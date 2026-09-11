"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import type { Pedido } from "@/lib/types";

interface GrupoDia {
  fecha: string; // clave YYYY-MM-DD para ordenar
  etiqueta: string; // texto legible, ej. "lunes, 9 de septiembre"
  pedidos: Pedido[];
  total: number;
}

const formateador = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function agruparPorDia(pedidos: Pedido[]): GrupoDia[] {
  const mapa = new Map<string, GrupoDia>();

  for (const pedido of pedidos) {
    const fecha = new Date(pedido.created_at);
    const clave = fecha.toISOString().slice(0, 10);
    const etiqueta = fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    if (!mapa.has(clave)) {
      mapa.set(clave, { fecha: clave, etiqueta, pedidos: [], total: 0 });
    }
    const grupo = mapa.get(clave)!;
    grupo.pedidos.push(pedido);
    grupo.total += pedido.total;
  }

  return Array.from(mapa.values()).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export default function VentasPage() {
  const [grupos, setGrupos] = useState<GrupoDia[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      // Una "venta" es un pedido que ya llegó al cliente y quedó pagado.
      const res = await fetch("/api/pedidos?estado=entregado");
      const pedidos: Pedido[] = await res.json();
      setGrupos(agruparPorDia(pedidos.filter((p) => p.pagado)));
      setCargando(false);
    }
    cargar();
  }, []);

  const totalGeneral = grupos.reduce((acc, g) => acc + g.total, 0);

  return (
    <main className="min-h-screen pb-16 max-w-2xl mx-auto">
      <AdminNav />
      <header className="px-4 pt-4 pb-2">
        <h1 className="font-display text-2xl">Ventas</h1>
        {!cargando && (
          <p className="text-tinta/50 text-sm mt-1">
            Total acumulado: <span className="font-semibold text-basil">{formateador.format(totalGeneral)}</span>
          </p>
        )}
      </header>

      <div className="px-4 flex flex-col gap-4 mt-2">
        {cargando && <p className="text-tinta/40 text-center py-10">Cargando ventas…</p>}

        {!cargando && grupos.length === 0 && (
          <p className="text-tinta/40 text-center py-10">
            Todavía no hay pedidos pagados. En cuanto un cliente pague, aparecerá aquí.
          </p>
        )}

        {grupos.map((grupo) => (
          <section key={grupo.fecha} className="bg-arena rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg capitalize">{grupo.etiqueta}</h2>
              <span className="font-semibold text-basil">{formateador.format(grupo.total)}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {grupo.pedidos
                .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                .map((pedido) => (
                  <li
                    key={pedido.id}
                    className="flex items-center justify-between bg-white rounded-xl px-3 py-2 text-sm"
                  >
                    <span>
                      Mesa {pedido.mesas?.numero ?? "?"} ·{" "}
                      {new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {pedido.metodo_pago && (
                        <span className="text-tinta/40"> · {pedido.metodo_pago}</span>
                      )}
                    </span>
                    <span className="font-medium">{formateador.format(pedido.total)}</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
