"use client";

/**
 * Ícono de carrito personalizado: un plato con tapa (cloche).
 * Dibujado a mano en SVG para que el pedido se sienta como comida
 * de verdad y no como un carrito de e-commerce genérico.
 */
export function CartIcon({ count, className = "" }: { count: number; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        {/* base / plato */}
        <ellipse cx="32" cy="46" rx="24" ry="5" fill="currentColor" opacity="0.9" />
        <rect x="10" y="44" width="44" height="3.5" rx="1.75" fill="currentColor" />
        {/* tapa (cloche) */}
        <path
          d="M12 40C12 25.6406 20.9543 14 32 14C43.0457 14 52 25.6406 52 40"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* pomo de la tapa */}
        <circle cx="32" cy="8" r="3.2" fill="currentColor" />
        <line x1="32" y1="11" x2="32" y2="15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brasa text-white text-[11px] leading-[18px] text-center font-sans font-semibold">
          {count}
        </span>
      )}
    </div>
  );
}
