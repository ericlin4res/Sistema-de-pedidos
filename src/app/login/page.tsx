"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  // useSearchParams necesita un límite de Suspense para poder
  // pre-renderizarse en Next.js 15.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "sin-rol"
      ? "Tu cuenta todavía no tiene un rol asignado. Pide a un administrador que te dé de alta."
      : null
  );
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email, password });
    if (errorLogin) {
      setCargando(false);
      console.error("Error de Supabase Auth:", errorLogin);
      setError(errorLogin.message);
      return;
    }

    // Tras iniciar sesión, redirige según el rol guardado en `perfiles`.
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setCargando(false);
      setError("No se pudo verificar tu sesión, inténtalo de nuevo.");
      return;
    }

    const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
    setCargando(false);

    if (!perfil?.rol) {
      setError("Tu cuenta todavía no tiene un rol asignado. Pide a un administrador que te dé de alta.");
      return;
    }

    const destino = params.get("volver") ?? (perfil.rol === "admin" ? "/admin" : "/cocina");
    router.push(destino);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={entrar} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-2xl mb-2">Acceso del equipo</h1>
        <input
          type="email"
          required
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-tinta/20 rounded-xl px-4 py-3 focus-visible-ring"
        />
        <input
          type="password"
          required
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-tinta/20 rounded-xl px-4 py-3 focus-visible-ring"
        />
        {error && <p className="text-brasa text-sm">{error}</p>}
        <button
          disabled={cargando}
          className="focus-visible-ring bg-basil text-white rounded-full py-3 font-semibold disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
