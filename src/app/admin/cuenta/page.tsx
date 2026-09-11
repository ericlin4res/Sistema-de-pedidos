"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { AdminNav } from "@/components/AdminNav";
import type { Perfil } from "@/lib/types";

export default function CuentaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen pb-16 max-w-2xl mx-auto">
      <AdminNav />
      <div className="px-4 pt-4 flex flex-col gap-8">
        <header>
          <h1 className="font-display text-2xl">Cuenta</h1>
          {email && <p className="text-tinta/50 text-sm mt-1">Sesión iniciada como {email}</p>}
        </header>

        <CambiarPassword />
        <GestionCocineros />
      </div>
    </main>
  );
}

function CambiarPassword() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    if (password.length < 6) {
      setMensaje({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (password !== confirmar) {
      setMensaje({ tipo: "error", texto: "Las contraseñas no coinciden." });
      return;
    }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setGuardando(false);

    if (error) {
      setMensaje({ tipo: "error", texto: error.message });
      return;
    }
    setMensaje({ tipo: "ok", texto: "Contraseña actualizada correctamente." });
    setPassword("");
    setConfirmar("");
  }

  return (
    <section className="bg-arena rounded-2xl p-4">
      <h2 className="font-display text-lg mb-3">Cambiar mi contraseña</h2>
      <form onSubmit={enviar} className="flex flex-col gap-3 max-w-sm">
        <input
          type="password"
          required
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
        />
        <input
          type="password"
          required
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
        />
        {mensaje && (
          <p className={`text-sm ${mensaje.tipo === "error" ? "text-brasa" : "text-basil"}`}>{mensaje.texto}</p>
        )}
        <button
          disabled={guardando}
          className="focus-visible-ring self-start px-5 py-2 rounded-full bg-basil text-white font-semibold text-sm disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>
    </section>
  );
}

function GestionCocineros() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setUsuarios(Array.isArray(data) ? data.filter((u: Perfil) => u.rol === "cocina") : []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearCocinero(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreando(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nombre })
    });
    setCreando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear la cuenta");
      return;
    }
    setNombre("");
    setEmail("");
    setPassword("");
    setMostrarForm(false);
    cargar();
  }

  async function eliminarCocinero(id: string) {
    if (!confirm("¿Eliminar el acceso de este cocinero? Ya no podrá iniciar sesión.")) return;
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <section className="bg-arena rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg">Cocineros</h2>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="focus-visible-ring px-4 py-2 rounded-full bg-basil text-white text-sm font-semibold"
          >
            + Nuevo cocinero
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={crearCocinero} className="flex flex-col gap-3 max-w-sm mb-4 bg-white rounded-xl p-3">
          <input
            placeholder="Nombre (opcional)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
          />
          <input
            type="email"
            required
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
          />
          {error && <p className="text-brasa text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={creando}
              className="focus-visible-ring flex-1 py-2 rounded-full bg-basil text-white font-semibold text-sm disabled:opacity-50"
            >
              {creando ? "Creando…" : "Crear cuenta"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="focus-visible-ring flex-1 py-2 rounded-full bg-arena text-tinta font-semibold text-sm border border-tinta/10"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && <p className="text-tinta/40 text-sm py-4">Cargando cocineros…</p>}

      <div className="flex flex-col gap-2">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
            <div>
              <p className="font-medium text-sm">{u.nombre || "Sin nombre"}</p>
              <p className="text-xs text-tinta/50">{u.email}</p>
            </div>
            <button onClick={() => eliminarCocinero(u.id)} className="focus-visible-ring text-sm text-brasa">
              Eliminar
            </button>
          </div>
        ))}
        {!cargando && usuarios.length === 0 && (
          <p className="text-tinta/40 text-sm py-2">Todavía no has agregado cocineros.</p>
        )}
      </div>
    </section>
  );
}
