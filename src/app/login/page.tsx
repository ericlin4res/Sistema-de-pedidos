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
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setCargando(false);
    if (error) {
      console.error("Error de Supabase Auth:", error);
      setError(error.message);
      return;
    }
    router.push(params.get("volver") ?? "/admin");
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
