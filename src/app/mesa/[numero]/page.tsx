"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useCart } from "@/hooks/useCart";
import { MenuList } from "@/components/MenuList";
import { CartDrawer } from "@/components/CartDrawer";
import { CartIcon } from "@/components/CartIcon";
import { OrderStatus } from "@/components/OrderStatus";
import { PaymentFlow } from "@/components/PaymentFlow";
import type { Categoria, EstadoPedido, Mesa, Producto } from "@/lib/types";

export default function MesaPage() {
  const params = useParams<{ numero: string }>();
  const codigoMesa = params.numero; // slug de la URL, ej. "mesa-3"
  const supabase = createClient();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoPedido | null>(null);
  const [pedidoTotal, setPedidoTotal] = useState(0);
  const [pedidoPagado, setPedidoPagado] = useState(false);
  const [pasoPago, setPasoPago] = useState(false); // true = ya se confirmó "entregado", mostrando cómo pagar

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cart = useCart(codigoMesa);

  // Carga inicial: mesa, menú y si ya había un pedido activo guardado localmente
  useEffect(() => {
    async function cargar() {
      const { data: mesaData } = await supabase
        .from("mesas")
        .select("*")
        .eq("codigo_qr", codigoMesa)
        .single();
      setMesa(mesaData);

      const { data: cats } = await supabase.from("categorias").select("*");
      setCategorias(cats ?? []);

      const { data: prods } = await supabase.from("productos").select("*").eq("activo", true);
      setProductos(prods ?? []);

      const pedidoGuardado = window.localStorage.getItem(`pedido-activo:${codigoMesa}`);
      if (pedidoGuardado) {
        setPedidoId(pedidoGuardado);
      }
      setCargando(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoMesa]);

  // Suscripción en tiempo real al estado del pedido activo
  useEffect(() => {
    if (!pedidoId) return;

    async function traerEstado() {
      const { data } = await supabase
        .from("pedidos")
        .select("estado, total, pagado")
        .eq("id", pedidoId)
        .single();
      if (!data) return;
      setEstadoPedido(data.estado);
      setPedidoTotal(data.total);
      setPedidoPagado(data.pagado);
      // Si recargó la página justo después de confirmar "entregado" pero
      // antes de pagar, lo mandamos directo a la pantalla de pago.
      if (data.estado === "entregado" && !data.pagado) setPasoPago(true);
      if (data.pagado) liberarMesa();
    }
    traerEstado();

    const canal = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${pedidoId}` },
        (payload) => {
          setEstadoPedido(payload.new.estado as EstadoPedido);
          setPedidoTotal(payload.new.total as number);
          setPedidoPagado(payload.new.pagado as boolean);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  async function revisarPedido(): Promise<{ resumen: string } | null> {
    const res = await fetch("/api/ia/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items })
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function enviarPedido() {
    if (!mesa) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesa_id: mesa.id, items: cart.items })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorEnvio(data?.error ?? "No se pudo enviar el pedido. Inténtalo de nuevo.");
        return;
      }
      const pedido = await res.json();
      window.localStorage.setItem(`pedido-activo:${codigoMesa}`, pedido.id);
      setPedidoId(pedido.id);
      setEstadoPedido("recibido");
      setPedidoTotal(pedido.total);
      setPedidoPagado(false);
      cart.vaciar();
      setCarritoAbierto(false);
    } catch {
      setErrorEnvio("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  // El cliente confirma que el camarero ya le llevó la comida a la mesa.
  async function confirmarEntrega() {
    if (!pedidoId) return;
    setConfirmandoEntrega(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "entregado" })
      });
      if (res.ok) {
        setEstadoPedido("entregado");
        setPasoPago(true);
      }
    } finally {
      setConfirmandoEntrega(false);
    }
  }

  // Pago en efectivo: se registra y se libera la mesa para el próximo cliente.
  async function confirmarPagoEfectivo() {
    if (!pedidoId) return;
    setProcesandoPago(true);
    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pago: "efectivo", pagado: true })
      });
      liberarMesa();
    } finally {
      setProcesandoPago(false);
    }
  }

  // Limpia todo el estado local para que la próxima persona que escanee
  // este QR (en este mismo dispositivo) empiece de cero con el menú.
  function liberarMesa() {
    window.localStorage.removeItem(`pedido-activo:${codigoMesa}`);
    setPedidoId(null);
    setEstadoPedido(null);
    setPasoPago(false);
    setPedidoPagado(false);
  }

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-tinta/50">Cargando menú…</div>;
  }

  if (!mesa) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-tinta/60">
        No encontramos esta mesa. Comprueba el código QR o avisa a un camarero.
      </div>
    );
  }

  if (pedidoId && pasoPago && !pedidoPagado) {
    return <PaymentFlow total={pedidoTotal} onConfirmarEfectivo={confirmarPagoEfectivo} procesando={procesandoPago} />;
  }

  if (pedidoId && estadoPedido) {
    return (
      <OrderStatus
        estado={estadoPedido}
        onConfirmarEntrega={confirmarEntrega}
        confirmandoEntrega={confirmandoEntrega}
      />
    );
  }

  return (
    <div className="pb-28">
      <header className="px-4 pt-6 pb-2">
        <p className="text-tinta/50">Mesa {mesa.numero}</p>
        <h1 className="font-display text-2xl">Nuestro menú</h1>
      </header>

      <MenuList
        productos={productos}
        categorias={categorias}
        onAgregar={(p) =>
          cart.agregar({ producto_id: p.id, nombre: p.nombre, precio: p.precio, foto_url: p.foto_url })
        }
      />

      {cart.cantidadTotal > 0 && (
        <button
          onClick={() => setCarritoAbierto(true)}
          className="focus-visible-ring fixed bottom-5 left-1/2 -translate-x-1/2 bg-tinta text-crema rounded-full pl-4 pr-5 py-3 flex items-center gap-3 shadow-lg"
        >
          <CartIcon count={cart.cantidadTotal} />
          <span className="font-semibold">
            {cart.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </span>
        </button>
      )}

      <CartDrawer
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        items={cart.items}
        total={cart.total}
        onCambiarCantidad={cart.cambiarCantidad}
        onQuitar={cart.quitar}
        onRevisar={revisarPedido}
        onEnviarPedido={enviarPedido}
        confirmando={enviando}
        error={errorEnvio}
      />
    </div>
  );
}
