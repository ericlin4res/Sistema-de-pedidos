import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import type { EstadoPedido, MetodoPago } from "@/lib/types";

const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  recibido: ["en_preparacion"],
  en_preparacion: ["listo"],
  listo: ["entregado"],
  entregado: []
};

interface CuerpoPatch {
  estado?: EstadoPedido;
  metodo_pago?: MetodoPago;
  pagado?: boolean;
}

// PATCH /api/pedidos/:id
// - Cocina lo usa para mover la tarjeta de columna (envía { estado }).
// - El cliente lo usa para marcar "ya me lo entregaron" (envía { estado: "entregado" })
//   y para registrar el pago en efectivo (envía { metodo_pago: "efectivo", pagado: true }).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: CuerpoPatch = await req.json();
  const supabase = createServiceClient();

  const cambios: Record<string, unknown> = {};

  if (body.estado) {
    const { data: actual, error: errorActual } = await supabase
      .from("pedidos")
      .select("estado")
      .eq("id", id)
      .single();

    if (errorActual || !actual) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const permitido = TRANSICIONES_VALIDAS[actual.estado as EstadoPedido]?.includes(body.estado);
    if (!permitido) {
      return NextResponse.json(
        { error: `No se puede pasar de "${actual.estado}" a "${body.estado}"` },
        { status: 400 }
      );
    }
    cambios.estado = body.estado;
  }

  if (body.metodo_pago) cambios.metodo_pago = body.metodo_pago;
  if (typeof body.pagado === "boolean") cambios.pagado = body.pagado;

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay cambios que aplicar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pedidos")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando pedido:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
