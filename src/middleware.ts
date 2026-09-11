import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Protege /cocina y /admin: solo usuarios autenticados Y con el rol
// correcto (guardado en la tabla `perfiles`) pueden entrar a cada uno.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) =>
          res.cookies.set(name, value, options),
        remove: (name: string, options: CookieOptions) =>
          res.cookies.set(name, "", { ...options, maxAge: 0 })
      }
    }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const esRutaAdmin = req.nextUrl.pathname.startsWith("/admin");
  const esRutaCocina = req.nextUrl.pathname.startsWith("/cocina");

  if (!session && (esRutaAdmin || esRutaCocina)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("volver", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session && (esRutaAdmin || esRutaCocina)) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", session.user.id)
      .single();

    const rol = perfil?.rol;

    // Sin perfil asignado: no sabemos qué panel le corresponde.
    if (!rol) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "sin-rol");
      return NextResponse.redirect(url);
    }

    // Cocina no puede entrar a Admin. Admin sí puede entrar a Cocina.
    if (esRutaAdmin && rol !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/cocina";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/cocina/:path*", "/admin/:path*"]
};
