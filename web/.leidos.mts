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
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 90_000));
  const { data: env } = await admin.from("envios").select("narrador_id, tipo, entrega, error_detalle").in("narrador_id", ids);
  const { data: est } = await admin.from("narradores").select("id, estado, dia_actual").in("id", ids);
  const conEstado = ((env ?? []) as any[]).filter((e) => e.entrega);
  const aceptaron = ((est ?? []) as any[]).filter((e) => e.estado !== "invitado");
  process.stdout.write(`[${new Date().toISOString().slice(11,16)}] avisos de Meta: ${conEstado.length} · aceptaron el SÍ: ${aceptaron.length}/4\n`);
  for (const e of conEstado) process.stdout.write(`    ${nombre.get(e.narrador_id)} ${e.tipo} → ${e.entrega}${e.error_detalle ? ` (${e.error_detalle})` : ""}\n`);
  for (const a of aceptaron) process.stdout.write(`    ✅ ${nombre.get(a.id)} aceptó · día ${a.dia_actual}\n`);
  if (conEstado.length > 0 || aceptaron.length > 0) { process.stdout.write("HAY NOVEDAD\n"); process.exit(0); }
}
