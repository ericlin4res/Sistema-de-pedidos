import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { obtenerPerfilActual } from "@/lib/authServer";

// GET /api/mesas -> lista de mesas (para que admin gestione y genere los QR)
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("mesas").select("*").order("numero");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/mesas -> crear una mesa nueva con su código de QR
export async function POST(req: NextRequest) {
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { numero }: { numero: number } = await req.json();
  if (!numero || numero <= 0) {
    return NextResponse.json({ error: "Número de mesa inválido" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("mesas")
    .insert({ numero, codigo_qr: `mesa-${numero}` })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
