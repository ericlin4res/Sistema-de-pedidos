export type EstadoPedido = "recibido" | "en_preparacion" | "listo" | "entregado";
export type MetodoPago = "efectivo" | "tarjeta";
export type TipoPedido = "local" | "delivery";
export type RolUsuario = "admin" | "cocina";

export interface Perfil {
  id: string;
  email?: string;
  nombre: string | null;
  rol: RolUsuario;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  categoria_id: string | null;
  agotado: boolean;
  activo: boolean;
}

export interface Mesa {
  id: string;
  numero: number;
  codigo_qr: string;
  activa: boolean;
}

export interface ItemCarrito {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  foto_url: string | null;
  nota?: string;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  producto_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  nota: string | null;
}

export interface Pedido {
  id: string;
  mesa_id: string | null;
  estado: EstadoPedido;
  tipo_pedido: TipoPedido;
  total: number;
  nota_cliente: string | null;
  resumen_ia: string | null;
  metodo_pago: MetodoPago | null;
  pagado: boolean;
  nombre_cliente: string | null;
  direccion_envio: string | null;
  created_at: string;
  updated_at: string;
  items_pedido?: ItemPedido[];
  mesas?: { numero: number };
}
