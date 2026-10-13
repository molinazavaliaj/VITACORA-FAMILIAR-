// La alarma de variables al arrancar la web (13/10). Es la mitad que faltaba del
// PR #23 (entrevistador y fábrica): en una semana pasó cuatro veces que el código
// estaba bien y lo apagaba la configuración, sin avisar. Al arrancar una instancia
// (src/instrumentation.ts), la web revisa las variables que lee de Vercel y, si
// falta alguna, la anota en el log y manda UN mail a los socios.
//
// Una vez por día aunque Vercel arranque muchas instancias: en memoria y con la
// misma marca en Storage que la fábrica y el entrevistador (`avisos/<día>/<sha1>.txt`
// en el bucket `audios`). Nunca frena el arranque y nunca tira.
//
// Regla del proyecto: nunca se muestra el valor de una variable, solo su nombre.
// No son una falta: las que tienen valor por defecto (URL_BASE, PRECIO_ARS,
// PRECIO_EUR), los precios de los productos que se venden aparte (sin precio, ese
// producto no se ofrece, a propósito), PROMO_PORCENTAJE y los interruptores apagados.

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Falta = { variable: string; problema: string };
type Env = NodeJS.ProcessEnv;

const vacia = (env: Env, nombre: string) => !(env[nombre] ?? "").trim();

const VARIABLES: ReadonlyArray<readonly [string, string]> = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Es obligatoria. Sin ella no anda el login, el panel ni la compra."],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Es obligatoria. Sin ella no anda el login ni el panel."],
  ["SUPABASE_SERVICE_ROLE_KEY", "Es obligatoria. Sin ella no se guardan compras, invitaciones, dudas ni nada de lo que escribe la web."],
  ["STRIPE_SECRET_KEY", "Sin ella no se puede pagar con tarjeta desde España (Stripe)."],
  ["STRIPE_WEBHOOK_SECRET", "Sin ella los pagos de Stripe no se confirman: se cobra y el pedido queda sin pagar."],
  ["MP_ACCESS_TOKEN", "Sin ella no se puede pagar con Mercado Pago desde Argentina."],
  ["MP_WEBHOOK_SECRET", "Sin ella los avisos de Mercado Pago se aceptan sin verificar la firma."],
  ["RESEND_API_KEY", "No sale ningún mail de la web (código para entrar, invitaciones, compra, regalo)."],
  ["MAIL_SOCIOS", "Sin ella este mismo aviso no le llega a nadie: queda solo en el log de Vercel."],
  ["WHATSAPP_NUMERO_PUBLICO", "La página del regalo no muestra el número de WhatsApp al que hay que escribir."],
  ["NEXT_PUBLIC_WA_NUMERO", "La página de gracias después de comprar no muestra el WhatsApp."],
  ["ADMIN_EMAILS", "Nadie puede entrar a /admin."],
  ["ENTREVISTADOR_URL", "Las preguntas sugeridas del panel no andan (dicen «todavía no están disponibles»)."],
  ["SUGERIDAS_CLAVE", "Las preguntas sugeridas del panel no andan (dicen «todavía no están disponibles»)."],
];

/** Qué variables faltan, con qué deja de andar por cada una. Puro: solo lee `env`. Nunca devuelve valores. */
export function revisarVariables(env: Env = process.env): Falta[] {
  const faltas = VARIABLES.filter(([nombre]) => vacia(env, nombre)).map(([variable, problema]) => ({ variable, problema }));
  // Interruptor prendido sin lo que necesita.
  if (env.REGALO_ENTREGA_WHATSAPP === "1" && vacia(env, "WHATSAPP_NUMERO_PUBLICO") && !faltas.some((f) => f.variable === "WHATSAPP_NUMERO_PUBLICO")) {
    faltas.push({ variable: "WHATSAPP_NUMERO_PUBLICO", problema: "REGALO_ENTREGA_WHATSAPP está prendida y falta el número." });
  }
  return faltas;
}

/** 'nueva': primera vez hoy; 'ya': otra instancia ya avisó hoy; 'no-se': no se pudo saber (se avisa igual). */
export type Marca = (dia: string, clave: string) => Promise<"nueva" | "ya" | "no-se">;

/** La marca del aviso en Storage, la misma que la de la fábrica (fabrica/src/variables.ts). Con tope de espera. */
export function marcaEnStorage(db: Pick<SupabaseClient, "storage">, esperaMs = 6_000): Marca {
  return async (dia, clave) => {
    try {
      const path = `avisos/${dia}/${createHash("sha1").update(clave).digest("hex")}.txt`;
      let reloj: ReturnType<typeof setTimeout> | undefined;
      const tarde = new Promise<"tarde">((r) => { reloj = setTimeout(() => r("tarde"), esperaMs); });
      const subida = db.storage.from("audios").upload(path, new Blob([dia]), { contentType: "text/plain", upsert: false });
      const res = await Promise.race([subida, tarde]).finally(() => clearTimeout(reloj));
      if (res === "tarde") return "no-se";
      const { error } = res;
      if (!error) return "nueva";
      const e = error as { message?: string; statusCode?: string | number };
      if (String(e.statusCode) === "409" || /already exists|duplicate/i.test(e.message ?? "")) return "ya";
      return "no-se";
    } catch {
      return "no-se";
    }
  };
}

const YA_AVISADO = new Set<string>();

/** Para los tests. */
export function olvidarAvisosDeVariables(): void {
  YA_AVISADO.clear();
}

export const CLAVE_AVISO_VARIABLES = "variables-web";
export const ASUNTO_VARIABLES = "A la web le faltan variables en Vercel";

async function marcaPorDefecto(): Promise<Marca | null> {
  try {
    const { crearClienteServidor } = await import("./supabase/servidor");
    return marcaEnStorage(crearClienteServidor());
  } catch {
    return null; // sin Supabase no hay marca: queda solo la memoria
  }
}

async function avisarPorDefecto(asunto: string, detalle: string): Promise<boolean> {
  const { enviarMailSocios } = await import("./mail");
  return enviarMailSocios(asunto, detalle);
}

/**
 * Al arrancar: revisa, anota en el log y avisa a los socios una vez por día (la clave
 * lleva una huella de la lista: si cambia, vuelve a avisar). Sin MAIL_SOCIOS o sin
 * RESEND_API_KEY no hay a quién mandarlo: solo log fuerte. Nunca tira.
 */
export async function avisarVariablesAlArrancar(o: {
  env?: Env;
  avisar?: (asunto: string, detalle: string) => Promise<boolean>;
  /** null: sin marca en Storage (solo memoria). Sin pasar: la del Storage de producción. */
  marca?: Marca | null;
  ahora?: Date;
} = {}): Promise<"ok" | "avisado" | "ya-avisado" | "solo-log"> {
  let llave: string | null = null;
  try {
    const env = o.env ?? process.env;
    const faltas = revisarVariables(env);
    if (faltas.length === 0) return "ok";
    const lista = faltas.map((f) => `- ${f.variable}. ${f.problema}`).join("\n");
    console.error(`VARIABLES QUE FALTAN EN LA WEB (${faltas.length})\n${lista}`);
    if (vacia(env, "MAIL_SOCIOS") || vacia(env, "RESEND_API_KEY")) {
      console.error("variables: sin MAIL_SOCIOS o sin RESEND_API_KEY no hay a quién mandar este aviso. Queda solo en este log.");
      return "solo-log";
    }

    const dia = (o.ahora ?? new Date()).toISOString().slice(0, 10);
    const clave = `${CLAVE_AVISO_VARIABLES}:${createHash("sha1").update(lista).digest("hex").slice(0, 12)}`;
    llave = `${clave}|${dia}`;
    if (YA_AVISADO.has(llave)) return "ya-avisado";
    YA_AVISADO.add(llave);
    const marca = o.marca === undefined ? await marcaPorDefecto() : o.marca;
    let estado: "nueva" | "ya" | "no-se" = "no-se";
    try {
      if (marca) estado = await marca(dia, clave);
    } catch {
      estado = "no-se"; // mejor un aviso de más que ninguno
    }
    if (estado === "ya") return "ya-avisado";

    const detalle =
      "Al arrancar, la web encontró esto en sus variables de Vercel.\n\n" +
      `${lista}\n\n` +
      "Acá van solo los nombres, nunca los valores.\n" +
      "Este aviso sale una vez por día mientras siga igual.";
    const salio = await (o.avisar ?? avisarPorDefecto)(ASUNTO_VARIABLES, detalle);
    if (!salio) YA_AVISADO.delete(llave);
    return salio ? "avisado" : "solo-log";
  } catch (err) {
    if (llave) YA_AVISADO.delete(llave);
    console.error("variables: no pude avisar las variables que faltan:", err instanceof Error ? err.message : err);
    return "solo-log";
  }
}
