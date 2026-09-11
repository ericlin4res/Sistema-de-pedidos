"use client";

import { useState } from "react";
import type { Categoria, Producto } from "@/lib/types";

export function ProductForm({
  categorias,
  productoEditando,
  onGuardado,
  onCancelar
}: {
  categorias: Categoria[];
  productoEditando: Producto | null;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(productoEditando?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoEditando?.descripcion ?? "");
  const [precio, setPrecio] = useState(productoEditando?.precio?.toString() ?? "");
  const [fotoUrl, setFotoUrl] = useState(productoEditando?.foto_url ?? "");
  const [categoriaId, setCategoriaId] = useState(productoEditando?.categoria_id ?? "");
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    const payload = {
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      foto_url: fotoUrl || null,
      categoria_id: categoriaId || null
    };

    if (productoEditando) {
      await fetch(`/api/productos/${productoEditando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    setGuardando(false);
    onGuardado();
  }

  return (
    <form onSubmit={enviar} className="bg-arena rounded-2xl p-4 flex flex-col gap-3 mb-4">
      <h2 className="font-display text-lg">{productoEditando ? "Editar producto" : "Nuevo producto"}</h2>
      <input
        required
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
      />
      <textarea
        placeholder="Descripción (opcional)"
        value={descripcion ?? ""}
        onChange={(e) => setDescripcion(e.target.value)}
        className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
      />
      <div className="flex gap-3">
        <input
          required
          type="number"
          step="0.01"
          min="0"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="flex-1 border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
        />
        <select
          value={categoriaId ?? ""}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="flex-1 border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <input
        placeholder="URL de la foto"
        value={fotoUrl ?? ""}
        onChange={(e) => setFotoUrl(e.target.value)}
        className="border border-tinta/20 rounded-xl px-3 py-2 focus-visible-ring"
      />
      <div className="flex gap-2 mt-1">
        <button
          disabled={guardando}
          className="focus-visible-ring flex-1 py-2 rounded-full bg-basil text-white font-semibold disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="focus-visible-ring flex-1 py-2 rounded-full bg-white text-tinta font-semibold border border-tinta/10"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
