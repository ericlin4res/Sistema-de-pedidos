import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import type { EstadoPedido } from "@/lib/types";

const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  recibido: ["en_preparacion"],
  en_preparacion: ["listo"],
  listo: ["entregado"],
  entregado: []
};

// PATCH /api/pedidos/:id -> cocina mueve la tarjeta de columna (Kanban)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { estado }: { estado: EstadoPedido } = await req.json();
  const supabase = createServiceClient();

  const { data: actual, error: errorActual } = await supabase
    .from("pedidos")
    .select("estado")
    .eq("id", id)
    .single();

  if (errorActual || !actual) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const permitido = TRANSICIONES_VALIDAS[actual.estado as EstadoPedido]?.includes(estado);
  if (!permitido) {
    return NextResponse.json(
      { error: `No se puede pasar de "${actual.estado}" a "${estado}"` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("pedidos")
    .update({ estado })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
