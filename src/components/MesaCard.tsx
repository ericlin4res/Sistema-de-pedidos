"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Mesa } from "@/lib/types";

export function MesaCard({
  mesa,
  onDesactivar
}: {
  mesa: Mesa;
  onDesactivar: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    // El QR apunta al mismo dominio donde está corriendo el panel de
    // administración, que es el mismo dominio donde los clientes
    // escanean el menú (window.location.origin funciona tanto en
    // desarrollo como ya desplegado en Vercel).
    const destino = `${window.location.origin}/mesa/${mesa.codigo_qr}`;
    setUrl(destino);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, destino, { width: 220, margin: 2 });
    }
  }, [mesa.codigo_qr]);

  function descargar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${mesa.codigo_qr}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-tinta/5 flex flex-col items-center gap-3">
      <p className="font-display text-lg">Mesa {mesa.numero}</p>
      <canvas ref={canvasRef} className="rounded-xl" />
      <p className="text-xs text-tinta/40 break-all text-center">{url}</p>
      <div className="flex gap-2 w-full">
        <button
          onClick={descargar}
          className="focus-visible-ring flex-1 py-2 rounded-full bg-basil text-white text-sm font-semibold"
        >
          Descargar QR
        </button>
        <button
          onClick={() => onDesactivar(mesa.id)}
          className="focus-visible-ring px-3 py-2 rounded-full bg-arena text-brasa text-sm font-semibold"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
