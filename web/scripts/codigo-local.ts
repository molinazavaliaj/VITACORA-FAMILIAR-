// Genera el código de 6 dígitos para entrar al panel EN LOCAL sin esperar el
// mail (Resend solo entrega a Naza hasta que el dominio esté verificado).
//
// Usa la misma puerta que el login real: el código se pega en /entrar como
// siempre. No hay atajos en la app — solo evitamos el correo.
//
//   npx tsx scripts/codigo-local.ts                       → set-dorado@vitacorafamiliar.com (Osvaldo, 30 respuestas)
//   npx tsx scripts/codigo-local.ts otra@persona.com      → cualquier familia que exista en la base
//
// Necesita SUPABASE_SERVICE_ROLE_KEY en web/.env.local. Solo para desarrollo.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (m && m[2]) process.env[m[1]] ??= m[2].trim();
}

const email = process.argv[2] ?? "set-dorado@vitacorafamiliar.com";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en web/.env.local");
  process.exit(1);
}

const admin = createClient(url, clave, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error("No pude generar el código:", error.message);
  process.exit(1);
}

console.log(`\n  Entrá en http://localhost:3000/entrar con:\n`);
console.log(`  Mail:    ${email}`);
console.log(`  Código:  ${data.properties.email_otp}\n`);
console.log(`  (vence en unos minutos; si vence, corré el script de nuevo)\n`);
