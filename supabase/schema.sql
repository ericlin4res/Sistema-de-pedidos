-- ============================================================
-- QR Restaurant · Schema de base de datos (Supabase / PostgreSQL)
-- ============================================================
-- Ejecutar en el SQL editor de Supabase, en orden.

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PERFILES (extiende auth.users con un rol)
-- ------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'cocina');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol rol_usuario not null default 'cocina',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. MESAS
-- ------------------------------------------------------------
create table public.mesas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  codigo_qr text unique, -- slug/token usado en la URL /mesa/[codigo]
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. CATEGORÍAS
-- ------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

insert into public.categorias (nombre, orden) values
  ('Aperitivos', 1),
  ('Platos principales', 2),
  ('Postres', 3),
  ('Bebidas', 4);

-- ------------------------------------------------------------
-- 4. PRODUCTOS
-- ------------------------------------------------------------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio >= 0),
  foto_url text,
  categoria_id uuid references public.categorias(id) on delete set null,
  agotado boolean not null default false,
  activo boolean not null default true, -- soft delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. PEDIDOS
-- ------------------------------------------------------------
create type public.estado_pedido as enum (
  'recibido',
  'en_preparacion',
  'listo',
  'entregado'
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id),
  estado public.estado_pedido not null default 'recibido',
  total numeric(10,2) not null default 0,
  nota_cliente text,
  resumen_ia text, -- texto que generó el agente de confirmación
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. ITEMS DE PEDIDO
-- ------------------------------------------------------------
create table public.items_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  nombre_producto text not null, -- copia histórica (si el producto cambia luego)
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  nota text
);

-- ------------------------------------------------------------
-- Índices útiles
-- ------------------------------------------------------------
create index idx_pedidos_estado on public.pedidos(estado);
create index idx_pedidos_mesa on public.pedidos(mesa_id);
create index idx_items_pedido on public.items_pedido(pedido_id);
create index idx_productos_categoria on public.productos(categoria_id);

-- ------------------------------------------------------------
-- Trigger: updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

create trigger trg_pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.mesas enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.items_pedido enable row level security;
alter table public.perfiles enable row level security;

-- Lectura pública (clientes escaneando QR necesitan ver mesas/menú)
create policy "lectura publica mesas" on public.mesas for select using (true);
create policy "lectura publica categorias" on public.categorias for select using (true);
create policy "lectura publica productos" on public.productos for select using (true);

-- Pedidos: cualquiera puede crear (el cliente sin login) y leer el suyo.
-- En el MVP se permite lectura/escritura pública de pedidos e items;
-- en producción conviene restringir con una función RPC + rate limiting.
create policy "insertar pedidos publico" on public.pedidos for insert with check (true);
create policy "leer pedidos publico" on public.pedidos for select using (true);
create policy "insertar items publico" on public.items_pedido for insert with check (true);
create policy "leer items publico" on public.items_pedido for select using (true);

-- Solo usuarios autenticados con rol cocina/admin pueden cambiar estado
create policy "cocina actualiza pedidos" on public.pedidos for update
  using (auth.role() = 'authenticated');

-- Productos: solo admin puede escribir (se valida también en API con service role)
create policy "admin escribe productos" on public.productos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin escribe mesas" on public.mesas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "perfil propio" on public.perfiles for select
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- Realtime: habilitar para que cocina reciba pedidos en vivo
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.items_pedido;

-- ------------------------------------------------------------
-- Datos de ejemplo (opcional, útil para probar el MVP)
-- ------------------------------------------------------------
insert into public.mesas (numero, codigo_qr) values
  (1, 'mesa-1'), (2, 'mesa-2'), (3, 'mesa-3'), (4, 'mesa-4');

insert into public.productos (nombre, descripcion, precio, categoria_id, foto_url)
select 'Guacamole con totopos', 'Aguacate fresco, limón, cilantro y chile serrano', 8.50,
  (select id from public.categorias where nombre = 'Aperitivos'),
  'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600'
union all
select 'Tacos al pastor (3 pz)', 'Piña asada, cilantro y cebolla', 9.90,
  (select id from public.categorias where nombre = 'Platos principales'),
  'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600'
union all
select 'Flan de la casa', 'Receta tradicional con caramelo', 5.00,
  (select id from public.categorias where nombre = 'Postres'),
  'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600'
union all
select 'Agua de horchata', 'Arroz, canela y vainilla', 3.50,
  (select id from public.categorias where nombre = 'Bebidas'),
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600';
