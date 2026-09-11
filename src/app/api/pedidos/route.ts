import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import type { ItemCarrito } from "@/lib/types";

// POST /api/pedidos -> el cliente confirma y el pedido se crea (llega a cocina)
export async function POST(req: NextRequest) {
  const { mesa_id, items }: { mesa_id: string; items: ItemCarrito[] } = await req.json();

  if (!mesa_id || !items || items.length === 0) {
    return NextResponse.json({ error: "Faltan datos del pedido" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Recalculamos precios desde la base de datos: nunca confiamos en el
  // precio que venga del navegador.
  const ids = items.map((i) => i.producto_id);
  const { data: productosDb, error: errorProductos } = await supabase
    .from("productos")
    .select("id, nombre, precio, agotado")
    .in("id", ids);

  if (errorProductos || !productosDb) {
    console.error("Error validando productos:", errorProductos);
    return NextResponse.json(
      { error: errorProductos?.message ?? "No se pudieron validar los productos" },
      { status: 500 }
    );
  }

  const disponibles = productosDb.filter((p) => !p.agotado);
  if (disponibles.length !== items.length) {
    return NextResponse.json(
      { error: "Alguno de los productos ya no está disponible, actualiza el menú" },
      { status: 409 }
    );
  }

  const total = items.reduce((acc, item) => {
    const producto = productosDb.find((p) => p.id === item.producto_id)!;
    return acc + producto.precio * item.cantidad;
  }, 0);

  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({ mesa_id, total, estado: "recibido", tipo_pedido: "local" })
    .select()
    .single();

  if (errorPedido || !pedido) {
    console.error("Error creando pedido:", errorPedido);
    return NextResponse.json(
      { error: errorPedido?.message ?? "No se pudo crear el pedido" },
      { status: 500 }
    );
  }

  const filasItems = items.map((item) => {
    const producto = productosDb.find((p) => p.id === item.producto_id)!;
    return {
      pedido_id: pedido.id,
      producto_id: producto.id,
      nombre_producto: producto.nombre,
      cantidad: item.cantidad,
      precio_unitario: producto.precio,
      nota: item.nota ?? null
    };
  });

  const { error: errorItems } = await supabase.from("items_pedido").insert(filasItems);
  if (errorItems) {
    console.error("Error guardando items del pedido:", errorItems);
    return NextResponse.json({ error: errorItems.message }, { status: 500 });
  }

  return NextResponse.json(pedido, { status: 201 });
}

// GET /api/pedidos?estado=recibido -> usado por el panel de cocina
export async function GET(req: NextRequest) {
  const estado = req.nextUrl.searchParams.get("estado");
  const supabase = createServiceClient();

  let query = supabase
    .from("pedidos")
    .select("*, items_pedido(*), mesas(numero)")
    .order("created_at", { ascending: true });

  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
