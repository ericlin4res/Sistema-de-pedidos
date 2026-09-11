-- ============================================================
-- Migración: método de pago en pedidos
-- Ejecuta esto en el SQL Editor de Supabase (proyecto ya existente).
-- Es seguro correrlo aunque ya tengas pedidos guardados.
-- ============================================================

alter table public.pedidos
  add column if not exists metodo_pago text check (metodo_pago in ('efectivo', 'tarjeta')),
  add column if not exists pagado boolean not null default false;

-- Índice para que la pantalla de ventas del admin sea rápida
create index if not exists idx_pedidos_pagado on public.pedidos(pagado);
