import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Protege /cocina y /admin: solo usuarios autenticados pueden entrar.
// El control fino de rol (admin vs cocina) se hace dentro de cada página,
// aquí solo verificamos que haya sesión.
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

  const { data: { session } } = await supabase.auth.getSession();

  const rutaProtegida =
    req.nextUrl.pathname.startsWith("/cocina") || req.nextUrl.pathname.startsWith("/admin");

  if (rutaProtegida && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("volver", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/cocina/:path*", "/admin/:path*"]
};
