import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";

// GET /api/productos -> lista para el panel de admin
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, categorias(nombre)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/productos -> crear producto nuevo
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("productos")
    .insert({
      nombre: body.nombre,
      descripcion: body.descripcion ?? null,
      precio: body.precio,
      foto_url: body.foto_url ?? null,
      categoria_id: body.categoria_id ?? null,
      agotado: body.agotado ?? false
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
