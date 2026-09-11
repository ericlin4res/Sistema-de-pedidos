import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { RolUsuario } from "./types";

/**
 * Lee la sesión actual (desde las cookies de Supabase Auth) dentro de una
 * API route y devuelve el usuario junto con su rol guardado en `perfiles`.
 * Se usa para proteger acciones sensibles (crear/borrar cocineros, mesas)
 * a nivel de servidor, sin depender solo de que la UI oculte botones.
 */
export async function obtenerPerfilActual() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {}
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? undefined,
    rol: (perfil?.rol as RolUsuario) ?? null,
    nombre: perfil?.nombre ?? null
  };
}

/** Atajo: true solo si hay sesión y el rol es "admin". */
export async function esAdmin() {
  const perfil = await obtenerPerfilActual();
  return perfil?.rol === "admin";
}
