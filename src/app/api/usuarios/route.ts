import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { obtenerPerfilActual } from "@/lib/authServer";

// GET /api/usuarios -> lista de cocineros y admins (solo para el admin)
export async function GET() {
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .order("nombre");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Los correos viven en auth.users, no en `perfiles`, así que los
  // completamos con la API de administración de Supabase Auth.
  const { data: usuariosAuth } = await supabase.auth.admin.listUsers();

  const combinados = perfiles.map((p) => ({
    ...p,
    email: usuariosAuth?.users.find((u) => u.id === p.id)?.email ?? null
  }));

  return NextResponse.json(combinados);
}

// POST /api/usuarios -> crear una cuenta de cocina nueva
export async function POST(req: NextRequest) {
  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { email, password, nombre } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Falta correo o contraseña" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: nuevoUsuario, error: errorCreando } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // se confirma automáticamente, lo dio de alta un admin
  });

  if (errorCreando || !nuevoUsuario.user) {
    return NextResponse.json({ error: errorCreando?.message ?? "No se pudo crear el usuario" }, { status: 500 });
  }

  const { error: errorPerfil } = await supabase
    .from("perfiles")
    .insert({ id: nuevoUsuario.user.id, rol: "cocina", nombre: nombre ?? null });

  if (errorPerfil) {
    // Si falla el perfil, no dejamos un usuario "huérfano" sin rol.
    await supabase.auth.admin.deleteUser(nuevoUsuario.user.id);
    return NextResponse.json({ error: errorPerfil.message }, { status: 500 });
  }

  return NextResponse.json({ id: nuevoUsuario.user.id, email, nombre: nombre ?? null, rol: "cocina" }, { status: 201 });
}
