import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { obtenerPerfilActual } from "@/lib/authServer";

// PATCH /api/mesas/:id -> renombrar mesa o activar/desactivarla
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("mesas").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/mesas/:id -> borrado lógico (activa = false), para no romper
// pedidos históricos que ya referencian esta mesa.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("mesas").update({ activa: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
