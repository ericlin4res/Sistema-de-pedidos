import { NextRequest, NextResponse } from "next/server";
import type { ItemCarrito } from "@/lib/types";

/**
 * Agente de confirmación de pedido.
 *
 * Por defecto es un "agente simple": arma un resumen legible y calcula
 * el total, sin llamar a ningún modelo externo. Si se define
 * ANTHROPIC_API_KEY, delega la redacción del resumen a Claude para que
 * suene más natural (por ejemplo agrupando alérgenos, avisando de
 * combinaciones raras, etc.), pero la lógica de negocio (el total)
 * siempre se calcula en el servidor, nunca confiando en el LLM.
 */
export async function POST(req: NextRequest) {
  const { items }: { items: ItemCarrito[] } = await req.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const lineas = items.map((i) => `• ${i.cantidad}x ${i.nombre}`).join("\n");
  const totalFormateado = total.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  let resumen = `${lineas}\n\nTotal: ${totalFormateado}`;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const respuesta = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `Redacta en español, en 2-3 frases cortas y amables, un resumen de este pedido de restaurante antes de confirmarlo. No inventes platos ni precios, usa solo estos datos:\n${lineas}\nTotal: ${totalFormateado}`
            }
          ]
        })
      });
      const data = await respuesta.json();
      const texto = data?.content?.find((b: { type: string }) => b.type === "text")?.text;
      if (texto) resumen = texto;
    } catch {
      // Si el LLM falla, nos quedamos con el resumen simple calculado arriba.
    }
  }

  return NextResponse.json({ resumen, total });
}
