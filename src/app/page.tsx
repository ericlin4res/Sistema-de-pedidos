export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-3xl text-tinta">Pide desde tu mesa</h1>
      <p className="text-tinta/70 max-w-xs">
        Escanea el código QR que está en tu mesa para ver el menú y hacer tu
        pedido. Si eres del equipo, entra al panel de{" "}
        <a href="/cocina" className="underline underline-offset-2">cocina</a> o{" "}
        <a href="/admin" className="underline underline-offset-2">administración</a>.
      </p>
    </main>
  );
}
