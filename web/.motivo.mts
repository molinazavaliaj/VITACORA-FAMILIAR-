import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const l of readFileSync("/Users/jmolinazavalia/Documents/Claude/Projects/vitacora/VITACORA-FAMILIAR-/web/.env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2].trim();
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const TELS = ["+34676737247", "+5491166226636", "+34636824626", "+5491156386425"];
for (let i = 0; i < 14; i++) {
  await new Promise((r) => setTimeout(r, 60_000));
  const { data: ns } = await admin.from("narradores").select("id, nombre, estado, contexto").in("telefono_whatsapp", TELS);
  const { data: env } = await admin.from("envios").select("narrador_id, tipo, wa_message_id").in("narrador_id", (ns as any[]).map((n) => n.id));
  const { data: lat } = await admin.from("latidos").select("ultimo_ping").eq("servicio", "entrevistador").maybeSingle();
  const hace = Math.round((Date.now() - new Date((lat as any).ultimo_ping).getTime()) / 60000);
  const salieron = ((env ?? []) as any[]).filter((e) => e.wa_message_id).length;
  const fallos = (ns as any[]).filter((n) => n.contexto?.falloBienvenida);
  process.stdout.write(`[${new Date().toISOString().slice(11,16)}] latido hace ${hace}min · salieron ${salieron}/4 · fallos anotados ${fallos.length}\n`);
  for (const f of fallos) process.stdout.write(`    ❌ ${f.nombre}: ${f.contexto.falloBienvenida.detalle}\n`);
  if (salieron >= 4 || fallos.length > 0) { process.stdout.write("YA SABEMOS\n"); process.exit(0); }
}
