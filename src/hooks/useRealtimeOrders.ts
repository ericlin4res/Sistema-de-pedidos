"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Pedido } from "@/lib/types";

/**
 * Trae los pedidos activos (no entregados) y se re-sincroniza cada vez
 * que hay un INSERT o UPDATE en la tabla `pedidos`, para que las tarjetas
 * nuevas aparezcan solas en la columna "Pedidos nuevos" sin recargar.
 */
export function useRealtimeOrders() {
  const supabase = createClient();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const { data } = await supabase
      .from("pedidos")
      .select("*, items_pedido(*), mesas(numero)")
      .neq("estado", "entregado")
      .order("created_at", { ascending: true });
    setPedidos(data ?? []);
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    recargar();

    const canal = supabase
      .channel("pedidos-cocina")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => recargar())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [recargar, supabase]);

  return { pedidos, cargando, recargar };
}
