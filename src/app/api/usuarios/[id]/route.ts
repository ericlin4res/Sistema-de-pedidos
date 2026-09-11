import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { obtenerPerfilActual } from "@/lib/authServer";

// DELETE /api/usuarios/:id -> elimina una cuenta de cocina
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (id === perfilActual.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta desde aquí" }, { status: 400 });
  }

  const supabase = createServiceClient();
  // Al borrar de auth.users, el trigger de FK con "on delete cascade"
  // en `perfiles` limpia también su fila de perfil automáticamente.
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
