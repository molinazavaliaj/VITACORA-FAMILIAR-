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
for (let i = 0; i < 16; i++) {
  await new Promise((r) => setTimeout(r, 60_000));
  const { data: env } = await admin.from("envios").select("narrador_id, wa_message_id, entrega, error_codigo, error_detalle, enviado_at")
    .in("narrador_id", ids).eq("tipo", "bienvenida");
  const filas = (env ?? []) as any[];
  const linea = filas.map((f) => `${nombre.get(f.narrador_id)}=${f.entrega ?? (f.wa_message_id ? "aceptado" : "FALLÓ")}`).join(" · ");
  process.stdout.write(`[${new Date().toISOString().slice(11,16)}] ${filas.length}/4 ${linea || "todavía nada"}\n`);
  for (const f of filas.filter((x) => x.error_detalle)) process.stdout.write(`    ❌ ${nombre.get(f.narrador_id)}: ${f.error_codigo} ${f.error_detalle}\n`);
  const conAviso = filas.filter((f) => f.entrega);
  if (conAviso.length >= 1) { process.stdout.write("YA HAY AVISOS DE META\n"); process.exit(0); }
}
process.stdout.write("16 minutos sin un solo aviso de Meta.\n");
