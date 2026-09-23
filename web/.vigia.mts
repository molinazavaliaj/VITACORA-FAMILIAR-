import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const l of readFileSync("/Users/jmolinazavalia/Documents/Claude/Projects/vitacora/VITACORA-FAMILIAR-/web/.env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2].trim();
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const TELS = ["+34676737247", "+5491166226636", "+34636824626", "+5491156386425"];
const { data: ns } = await admin.from("narradores").select("id, nombre, telefono_whatsapp").in("telefono_whatsapp", TELS);
const ids = (ns as any[]).map((n) => n.id);
const nombre = new Map((ns as any[]).map((n) => [n.id, n.nombre]));
for (let i = 0; i < 25; i++) {
  await new Promise((r) => setTimeout(r, 60_000));
  const { data } = await admin.from("envios").select("narrador_id, tipo, enviado_at, wa_message_id").in("narrador_id", ids);
  const filas = (data ?? []) as any[];
  console.log(`[${new Date().toISOString().slice(11, 16)}] envíos: ${filas.length}/4 — ${filas.map((f) => `${nombre.get(f.narrador_id)}:${f.tipo}${f.wa_message_id ? "" : "(SIN ID)"}`).join(" · ") || "todavía nada"}`);
  if (filas.length >= 4) {
    const { data: ests } = await admin.from("narradores").select("nombre, estado").in("id", ids);
    console.log("LAS CUATRO BIENVENIDAS SALIERON. Estados:", (ests as any[]).map((e) => `${e.nombre}=${e.estado}`).join(", "));
    process.exit(0);
  }
}
