"use client";

import { useCallback, useEffect, useState } from "react";
import type { ItemCarrito } from "@/lib/types";

/**
 * Carrito guardado en localStorage, aislado por mesa, para que si el
 * cliente recarga la página (o el navegador se cierra un momento)
 * no pierda lo que ya había elegido.
 */
export function useCart(mesaCodigo: string) {
  const storageKey = `carrito:${mesaCodigo}`;
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, storageKey, hydrated]);

  const agregar = useCallback((item: Omit<ItemCarrito, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto_id === item.producto_id);
      if (existente) {
        return prev.map((i) =>
          i.producto_id === item.producto_id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((producto_id: string, cantidad: number) => {
    setItems((prev) => {
      if (cantidad <= 0) return prev.filter((i) => i.producto_id !== producto_id);
      return prev.map((i) => (i.producto_id === producto_id ? { ...i, cantidad } : i));
    });
  }, []);

  const quitar = useCallback((producto_id: string) => {
    setItems((prev) => prev.filter((i) => i.producto_id !== producto_id));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  return { items, agregar, cambiarCantidad, quitar, vaciar, total, cantidadTotal };
}
