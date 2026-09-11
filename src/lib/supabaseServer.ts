import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase para usar SOLO en el servidor (API routes).
// Usa la service role key: se salta RLS, por lo que nunca debe
// exponerse al navegador ni importarse en un archivo "use client".
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
