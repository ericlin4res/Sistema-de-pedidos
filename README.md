# Pide desde tu mesa — Sistema de pedidos por QR para restaurantes

MVP funcional con 3 partes: **web para clientes**, **panel de cocina (Kanban)** y
**panel de administración de productos**. Construido con Next.js (App Router),
Supabase (Postgres + Auth + Realtime) y Tailwind CSS.

## 1. Estructura del proyecto

```
qr-restaurant/
├── supabase/
│   └── schema.sql              # Tablas, RLS, triggers y datos de ejemplo
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout raíz (fuentes, estilos globales)
│   │   ├── page.tsx             # Landing simple
│   │   ├── login/page.tsx       # Login del equipo (cocina/admin)
│   │   ├── mesa/[numero]/       # Web del cliente: /mesa/mesa-3
│   │   │   └── page.tsx
│   │   ├── cocina/page.tsx      # Panel Kanban (protegido)
│   │   ├── admin/page.tsx       # CRUD de productos (protegido)
│   │   └── api/
│   │       ├── pedidos/route.ts         # POST crear pedido, GET listar
│   │       ├── pedidos/[id]/route.ts    # PATCH cambiar estado (Kanban)
│   │       ├── productos/route.ts       # GET listar, POST crear
│   │       ├── productos/[id]/route.ts  # PATCH editar/agotar, DELETE (soft)
│   │       ├── mesas/route.ts           # GET/POST mesas (para imprimir QRs)
│   │       └── ia/confirmar/route.ts    # Agente que resume el pedido
│   ├── components/
│   │   ├── CartIcon.tsx          # Ícono "plato con tapa" hecho a mano en SVG
│   │   ├── MenuList.tsx          # Menú + filtros por categoría
│   │   ├── CartDrawer.tsx        # Carrito deslizante + paso de confirmación
│   │   ├── OrderStatus.tsx       # Pantalla de fases del pedido
│   │   ├── KanbanBoard.tsx       # 3 columnas de cocina
│   │   ├── KanbanCard.tsx        # Tarjeta de pedido individual
│   │   ├── ProductForm.tsx       # Alta/edición de producto
│   │   └── ProductTable.tsx      # Listado con acciones (editar/agotar/borrar)
│   ├── hooks/
│   │   ├── useCart.ts            # Carrito con localStorage por mesa
│   │   └── useRealtimeOrders.ts  # Suscripción en vivo para cocina
│   ├── lib/
│   │   ├── supabaseClient.ts     # Cliente para el navegador (anon key)
│   │   ├── supabaseServer.ts     # Cliente para API routes (service role)
│   │   └── types.ts              # Tipos compartidos
│   ├── styles/globals.css
│   └── middleware.ts             # Protege /cocina y /admin con sesión
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
3. En **Authentication → Users**, crea manualmente un usuario para cocina y
   otro para administración (email + contraseña), y opcionalmente añade una
   fila en `perfiles` con su `rol`.
4. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas al navegador!)

### 4.2 Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables**, añade las 3 variables de Supabase (y
   `ANTHROPIC_API_KEY` si quieres el resumen con IA real).
4. Deploy. Next.js se detecta automáticamente.
5. Genera los QR: cada mesa apunta a `https://tu-dominio.vercel.app/mesa/mesa-N`
   (puedes generarlos con cualquier generador de QR gratuito, o crear luego un
   botón en `/admin` que los genere e imprima).

### 4.3 Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena con tus claves de Supabase
npm run dev
```

## 5. Roadmap de fases

**Fase 0 — MVP (este entregable)**
- Menú digital con filtros, carrito, confirmación con IA, tracker de estado.
- Kanban de cocina en tiempo real.
- CRUD de productos con "agotado" y borrado lógico.
- Auth simple (email/password) para cocina y admin.

**Fase 1 — Pulido de producto**
- Animaciones de transición (carrito, cambios de fase, drag entre columnas).
- Generador e impresión de QRs desde `/admin`.
- Notas por producto (alergias, "sin cebolla", etc.) — el campo `nota` ya
  existe en el schema, falta exponerlo en la UI del cliente.
- Sonido/vibración en la tablet de cocina cuando llega un pedido nuevo.

**Fase 2 — Pagos y notificaciones**
- Integración de pagos (Stripe / Redsys) antes o después de comer.
- Notificaciones push al cliente cuando su pedido esté "Listo".
- Botón de "llamar al camarero" desde la web del cliente.

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
