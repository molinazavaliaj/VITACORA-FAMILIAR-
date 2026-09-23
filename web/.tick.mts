import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const l of readFileSync("/Users/jmolinazavalia/Documents/Claude/Projects/vitacora/VITACORA-FAMILIAR-/web/.env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2].trim();
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const TELS = ["+34676737247", "+5491166226636", "+34636824626", "+5491156386425"];
const { data: ns } = await admin.from("narradores").select("id, nombre").in("telefono_whatsapp", TELS);
const ids = (ns as any[]).map((n) => n.id);
const nombre = new Map((ns as any[]).map((n) => [n.id, n.nombre]));
const inicio = new Date().toISOString();
for (let i = 0; i < 22; i++) {
  await new Promise((r) => setTimeout(r, 60_000));
  const [{ data: env }, { data: lat }] = await Promise.all([
    admin.from("envios").select("narrador_id, tipo, wa_message_id, entrega, error_detalle").in("narrador_id", ids),
    admin.from("latidos").select("ultimo_ping").eq("servicio", "entrevistador").maybeSingle(),
  ]);
  const filas = (env ?? []) as any[];
  const ping = (lat as any)?.ultimo_ping;
  const hace = ping ? Math.round((Date.now() - new Date(ping).getTime()) / 60000) : -1;
  process.stdout.write(`[${new Date().toISOString().slice(11,16)}] latido hace ${hace} min · bienvenidas ${filas.length}/4` +
    (filas.length ? ` — ${filas.map((f) => `${nombre.get(f.narrador_id)}:${f.entrega ?? (f.wa_message_id ? "aceptado" : "SIN ID")}${f.error_detalle ? ` (${f.error_detalle})` : ""}`).join(" · ")}` : "") + "\n");
  if (filas.length >= 4) { process.stdout.write("LAS CUATRO SALIERON\n"); process.exit(0); }
}
process.stdout.write("22 minutos y no salió ninguna.\n");
