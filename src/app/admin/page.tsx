"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { ProductForm } from "@/components/ProductForm";
import { ProductTable } from "@/components/ProductTable";
import type { Categoria, Producto } from "@/lib/types";

export default function AdminPage() {
  const supabase = createClient();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);

  async function cargar() {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data.filter((p: Producto) => p.activo !== false));

    const { data: cats } = await supabase.from("categorias").select("*");
    setCategorias(cats ?? []);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este producto? Seguirá apareciendo en pedidos ya hechos.")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    cargar();
  }

  async function toggleAgotado(p: Producto) {
    await fetch(`/api/productos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agotado: !p.agotado })
    });
    cargar();
  }

  return (
    <main className="min-h-screen px-4 pt-6 pb-16 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl">Productos</h1>
        {!mostrarForm && (
          <button
            onClick={() => {
              setEditando(null);
              setMostrarForm(true);
            }}
            className="focus-visible-ring px-4 py-2 rounded-full bg-basil text-white font-semibold text-sm"
          >
            + Nuevo
          </button>
        )}
      </header>

      {mostrarForm && (
        <ProductForm
          categorias={categorias}
          productoEditando={editando}
          onGuardado={() => {
            setMostrarForm(false);
            cargar();
          }}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      <ProductTable
        productos={productos}
        onEditar={(p) => {
          setEditando(p);
          setMostrarForm(true);
        }}
        onEliminar={eliminar}
        onToggleAgotado={toggleAgotado}
      />
    </main>
  );
}
