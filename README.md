# Pide desde tu mesa — Sistema de pedidos por QR para restaurantes

MVP funcional con 3 partes: **web para clientes**, **panel de cocina (Kanban)** y
**panel de administración de productos**. Construido con Next.js (App Router),
Supabase (Postgres + Auth + Realtime) y Tailwind CSS.

## 1. Estructura del proyecto

```
qr-restaurant/
├── supabase/
│   ├── schema.sql                # Tablas, RLS, triggers y datos de ejemplo
│   ├── migracion_pagos.sql       # Añade metodo_pago/pagado (proyectos ya creados)
│   └── migracion_roles_delivery.sql  # Añade tipo_pedido + bootstrap de admin
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout raíz (fuentes, estilos globales)
│   │   ├── page.tsx             # Landing simple
│   │   ├── login/page.tsx       # Login del equipo, redirige según el rol
│   │   ├── mesa/[numero]/       # Web del cliente: /mesa/mesa-3
│   │   │   └── page.tsx
│   │   ├── cocina/page.tsx      # Kanban (protegido) con pestañas Local/Delivery
│   │   ├── admin/
│   │   │   ├── page.tsx         # CRUD de productos (protegido, rol admin)
│   │   │   ├── mesas/page.tsx   # Alta/baja de mesas + QR descargable
│   │   │   ├── ventas/page.tsx  # Ventas por día + productos vendidos
│   │   │   └── cuenta/page.tsx  # Cambiar contraseña + gestionar cocineros
│   │   └── api/
│   │       ├── pedidos/route.ts         # POST crear pedido, GET listar
│   │       ├── pedidos/[id]/route.ts    # PATCH estado / método de pago
│   │       ├── productos/route.ts       # GET listar, POST crear
│   │       ├── productos/[id]/route.ts  # PATCH editar/agotar, DELETE (soft)
│   │       ├── mesas/route.ts           # GET listar, POST crear (admin)
│   │       ├── mesas/[id]/route.ts      # PATCH/DELETE (admin)
│   │       ├── usuarios/route.ts        # GET/POST cocineros (admin)
│   │       ├── usuarios/[id]/route.ts   # DELETE cocinero (admin)
│   │       └── ia/confirmar/route.ts    # Agente que resume el pedido
│   ├── components/
│   │   ├── CartIcon.tsx          # Ícono "plato con tapa" hecho a mano en SVG
│   │   ├── MenuList.tsx          # Menú + filtros por categoría
│   │   ├── CartDrawer.tsx        # Carrito deslizante + paso de confirmación
│   │   ├── OrderStatus.tsx       # Pantalla de fases del pedido
│   │   ├── PaymentFlow.tsx       # Elegir método de pago y confirmar efectivo
│   │   ├── KanbanBoard.tsx       # Columnas de cocina
│   │   ├── KanbanCard.tsx        # Tarjeta de pedido individual
│   │   ├── ProductForm.tsx       # Alta/edición de producto
│   │   ├── ProductTable.tsx      # Listado con acciones (editar/agotar/borrar)
│   │   ├── MesaCard.tsx          # Tarjeta de mesa con QR y botón de descarga
│   │   └── AdminNav.tsx          # Pestañas del panel de administración
│   ├── hooks/
│   │   ├── useCart.ts            # Carrito con localStorage por mesa
│   │   └── useRealtimeOrders.ts  # Suscripción en vivo para cocina
│   ├── lib/
│   │   ├── supabaseClient.ts     # Cliente para el navegador (anon key)
│   │   ├── supabaseServer.ts     # Cliente para API routes (service role)
│   │   ├── authServer.ts         # Lee usuario + rol desde las cookies (API routes)
│   │   └── types.ts              # Tipos compartidos
│   ├── styles/globals.css
│   └── middleware.ts             # Protege /cocina y /admin según sesión y rol
├── package.json
├── tailwind.config.js
├── .env.example
└── README.md
```

## 2. Modelo de datos (`supabase/schema.sql`)

| Tabla           | Para qué sirve                                                   |
|-----------------|-------------------------------------------------------------------|
| `mesas`         | Una fila por mesa física; `codigo_qr` es el slug de la URL (`/mesa/mesa-3`). |
| `categorias`    | Aperitivos, Platos principales, Postres, Bebidas…                 |
| `productos`     | Nombre, precio, foto, categoría, `agotado`, `activo` (borrado lógico). |
| `pedidos`       | Un pedido por mesa/ronda; `estado` es la máquina de estados del flujo. |
| `items_pedido`  | Líneas del pedido (producto + cantidad + precio congelado).       |
| `perfiles`      | Extiende `auth.users` con un `rol` (`admin` / `cocina`).           |

El estado del pedido sigue siempre esta secuencia (validada en el backend,
`src/app/api/pedidos/[id]/route.ts`):

```
recibido → en_preparacion → listo → entregado
```

Row Level Security está activado en todas las tablas: el menú es de lectura
pública (para que el QR funcione sin login), crear pedidos es público, pero
**editar productos o cambiar el estado de un pedido requiere sesión**
autenticada. Realtime está habilitado sobre `pedidos` e `items_pedido` para
que la cocina vea las tarjetas nuevas sin recargar.

## 3. Cómo funciona cada parte

**Cliente (`/mesa/[numero]`)**: lee la mesa por su `codigo_qr`, carga el menú,
guarda el carrito en `localStorage` (aislado por mesa, sobrevive a recargas).
Al pulsar "Revisar pedido" se llama a `/api/ia/confirmar`, que arma un resumen
del pedido y el total — por defecto con lógica simple (sin costo ni
latencia de red), y si se define `ANTHROPIC_API_KEY` delega la redacción del
resumen a Claude mientras sigue calculando el total en el servidor. El
cliente nunca decide el precio: `/api/pedidos` vuelve a leer los precios
desde la base de datos antes de guardar el pedido. Tras confirmar, la pantalla
pasa a un tracker con las 4 fases, actualizado por Supabase Realtime.

**Cocina (`/cocina`)**: tablero de 3 columnas (Pedidos nuevos, En
preparación, Completados) que se re-sincroniza solo vía Realtime. Los botones
"Empezar" y "Terminar" llaman a `PATCH /api/pedidos/:id`, que valida que la
transición de estado sea válida antes de guardarla.

**Administración (`/admin`)**: CRUD de productos. "Eliminar" es un borrado
lógico (`activo = false`) para no romper pedidos históricos que ya
referencian ese producto; "Agotado" es un interruptor rápido para cuando se
acaba un plato a media noche sin tener que editarlo entero.

## 4. Despliegue (Vercel + Supabase)

### 4.1 Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** → pega el contenido de `supabase/schema.sql` → Run.
3. Corre también `supabase/migracion_pagos.sql` y `supabase/migracion_roles_delivery.sql`
   (si empiezas un proyecto desde cero, ya están incluidos en `schema.sql`; estos
   archivos sueltos son solo para actualizar un proyecto que ya tenías corriendo).
4. **Crea tu primer usuario admin** (paso obligatorio, una sola vez):
   - Ve a **Authentication → Users → Add user**, crea tu cuenta con email/contraseña,
     y marca "Auto Confirm User".
   - Copia su **User UID**.
   - En el SQL Editor, corre:
     ```sql
     insert into public.perfiles (id, rol, nombre)
     values ('PEGA-AQUI-TU-USER-UID', 'admin', 'Tu nombre');
     ```
   - A partir de aquí, ya no necesitas volver a tocar SQL: desde **Cuenta → Cocineros**
     dentro del panel de administración puedes crear las cuentas del personal de cocina.
5. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas al navegador!)

### 4.2 Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables**, añade las 3 variables de Supabase (y
   `ANTHROPIC_API_KEY` si quieres el resumen con IA real).
4. Deploy. Next.js se detecta automáticamente.
5. Entra a `/login` con tu cuenta admin, y desde **Mesas** crea tus mesas y descarga
   sus QR directamente (ya no hace falta generarlos a mano).

### 4.3 Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena con tus claves de Supabase
npm run dev
```

## 5. Roadmap de fases

**Fase 0 — MVP (este entregable)**
- Menú digital con filtros, carrito, confirmación con IA, tracker de estado.
- Kanban de cocina en tiempo real, separado en pedidos del Local y Delivery
  (Delivery queda listo para conectarse a una futura app de repartidores).
- CRUD de productos con "agotado" y borrado lógico.
- Roles reales con Supabase Auth: admin y cocina, cada uno con su panel.
- Panel de administración: productos, mesas (con generación y descarga de QR),
  ventas por día (con productos y cantidades vendidas), y gestión de cuenta
  (cambiar contraseña, crear/eliminar cocineros).
- Flujo de entrega y pago: el cliente confirma "ya me lo entregaron", elige
  efectivo (con confirmación) o tarjeta (aviso de "próximamente"), y la mesa
  queda lista para el siguiente cliente.

**Fase 1 — Pulido de producto**
- Animaciones de transición (carrito, cambios de fase, drag entre columnas).
- Generador e impresión de QRs desde `/admin`.
- Notas por producto (alergias, "sin cebolla", etc.) — el campo `nota` ya
  existe en el schema, falta exponerlo en la UI del cliente.
- Sonido/vibración en la tablet de cocina cuando llega un pedido nuevo.

**Fase 2 — Pagos y notificaciones**
- Integración de pagos (Stripe / Redsys) antes o después de comer — ahora mismo
  la opción "Tarjeta" ya está en la UI, solo falta conectarla a un proveedor real.
- Notificaciones push al cliente cuando su pedido esté "Listo".
- Botón de "llamar al camarero" desde la web del cliente.
- App Android para repartidores de Delivery, que cree pedidos con
  `tipo_pedido = 'delivery'` y aparezcan en la pestaña correspondiente de cocina
  (la base de datos y el Kanban ya están preparados para esto).

**Fase 3 — Multi-restaurante**
- Añadir `restaurante_id` a mesas/productos/pedidos y filtrar todo por
  restaurante (multi-tenant).
- Panel de super-admin para dar de alta restaurantes.
- Reportes de ventas por producto/categoría/hora.

**Fase 4 — Operación avanzada**
- Impresora de tickets en cocina.
- Roles más finos (camarero vs. jefe de cocina vs. dueño).
- App de camarero para tomar pedidos en mesa como alternativa al QR.

## 6. Notas de seguridad y mantenimiento

- Las dependencias se fijaron a versiones sin vulnerabilidades conocidas al
  momento de construir este proyecto (Next.js 15.5.25, React 19). Ejecuta
  `npm audit` periódicamente y actualiza cuando Vercel/Next publiquen
  parches de seguridad.
- El proyecto ya se compiló (`npm run build`) y se verificó con `tsc --noEmit`
  sin errores antes de entregarse.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en `src/lib/supabaseServer.ts`,
  importado exclusivamente desde archivos de API (`route.ts`), nunca desde
  componentes de cliente.
