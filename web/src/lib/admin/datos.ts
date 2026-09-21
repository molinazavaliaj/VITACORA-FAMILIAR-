import type { SupabaseClient } from "@supabase/supabase-js";

// Las consultas del panel de la empresa: todo lo que se lee de la base, en un solo lugar y
// del lado del servidor (service role). Las páginas no consultan: piden datos ya armados.
//
// Reglas que salen del spec:
// - Cada consulta trae SUS columnas (nada de `select *`) y ordena por lo que la pantalla usa.
// - El consumo de IA y los gastos a mano se piden de los últimos 31 días, no de toda la
//   historia: el panel mira el mes en curso.
// - Si una consulta falla (la tabla no está migrada, no hay permiso, la red se cayó), esa
//   lista vuelve VACÍA y se avisa por consola: el panel muestra lo que sí pudo leer. Una
//   tabla que falta es un estado vacío, nunca una página rota (spec, Review Focus 2).
// - Las respuestas y los envíos se piden sólo de los narradores en juego: traer las
//   respuestas de todos los libros terminaría bajando la historia entera para nada.

/** Cuántos días de consumo y de gastos mira el panel. */
export const CORTE_DIAS = 31;

/** Los estados de un narrador que todavía está en juego (ni terminado ni sin pagar). */
const EN_CURSO = ["invitado", "acepto", "activo", "pausado"];

export type NarradorPanel = {
  id: string;
  nombre: string | null;
  como_le_dicen: string | null;
  estado: string;
  dia_actual: number | null;
  familia_id: string | null;
  ultima_respuesta_at: string | null;
  alerta_silencio: boolean | null;
  libro_aprobado_at: string | null;
  contexto: Record<string, unknown> | null;
};

export type FamiliaPanel = { id: string; region: string | null; email: string | null; nombre: string | null };

export type PedidoPanel = {
  id: string;
  narrador_id: string | null;
  familia_id: string | null;
  estado: string;
  monto: number | null;
  moneda: string | null;
  extras: Record<string, unknown> | null;
  created_at: string;
  proveedor: string | null;
};

export type RespuestaPanel = {
  narrador_id: string;
  pregunta_orden: number;
  es_repregunta: boolean;
  texto_directo: string | null;
  transcripcion: string | null;
  duracion_segundos: number | null;
  recibido_at: string;
};

export type EnvioPanel = { narrador_id: string; tipo: string; enviado_at: string };

export type NarracionPanel = {
  id: string;
  narrador_id: string | null;
  estado: string;
  actualizada_at: string | null;
  created_at: string;
};

export type FotoPanel = { narrador_id: string };

export type ConsumoPanel = {
  fecha: string;
  servicio: string;
  paso: string;
  modelo: string;
  proveedor: string;
  cuenta: string | null;
  narrador_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cantidad: number | null;
  unidad: string | null;
  usd: number;
};

export type LatidoPanel = { servicio: string; ultimo_ping: string; detalle: Record<string, unknown> | null };

export type GastoPanel = {
  fecha: string;
  concepto: string;
  monto: number;
  moneda: string;
  categoria: string;
  quien: string | null;
};

export type DatosDelPanel = {
  narradores: NarradorPanel[];
  familias: FamiliaPanel[];
  pedidos: PedidoPanel[];
  respuestas: RespuestaPanel[];
  envios: EnvioPanel[];
  narraciones: NarracionPanel[];
  fotos: FotoPanel[];
  consumo: ConsumoPanel[];
  latidos: LatidoPanel[];
  gastos: GastoPanel[];
};

/** Una consulta, con su red de seguridad: si falla, avisa y devuelve vacío.
 *  Recibe una función y no la consulta ya armada: si el cliente tira al construirla
 *  (una tabla que no existe es un error al pedirla, no al esperarla), igual se atrapa. */
async function leerLista<T>(
  que: string,
  consulta: () => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  try {
    const { data, error } = await consulta();
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  } catch (err) {
    console.error(`panel de la empresa: no pude leer ${que}: ${(err as Error).message}`);
    return [];
  }
}

export async function datosDelPanel(admin: SupabaseClient, ahora: Date): Promise<DatosDelPanel> {
  const corte = new Date(ahora.getTime() - CORTE_DIAS * 86_400_000).toISOString();

  // Los narradores van primero: sin sus ids no se sabe qué respuestas ni qué envíos importan.
  const narradores = await leerLista<NarradorPanel>("los narradores", () =>
    admin
      .from("narradores")
      .select(
        "id, nombre, como_le_dicen, estado, dia_actual, familia_id, ultima_respuesta_at, alerta_silencio, libro_aprobado_at, contexto",
      )
      .order("created_at", { ascending: false }),
  );
  const enCurso = narradores.filter((n) => EN_CURSO.includes(n.estado)).map((n) => n.id);

  const [familias, pedidos, respuestas, envios, narraciones, fotos, consumo, latidos, gastos] =
    await Promise.all([
      leerLista<FamiliaPanel>("las familias", () =>
        admin.from("familias").select("id, region, email, nombre"),
      ),
      leerLista<PedidoPanel>("los pedidos", () =>
        admin
          .from("pedidos")
          .select("id, narrador_id, familia_id, estado, monto, moneda, extras, created_at, proveedor")
          .order("created_at", { ascending: false }),
      ),
      enCurso.length === 0
        ? Promise.resolve<RespuestaPanel[]>([])
        : leerLista<RespuestaPanel>("las respuestas", () =>
            admin
              .from("respuestas")
              .select(
                "narrador_id, pregunta_orden, es_repregunta, texto_directo, transcripcion, duracion_segundos, recibido_at",
              )
              .in("narrador_id", enCurso)
              .order("recibido_at", { ascending: false })
              .limit(500),
          ),
      enCurso.length === 0
        ? Promise.resolve<EnvioPanel[]>([])
        : leerLista<EnvioPanel>("los envíos", () =>
            admin
              .from("envios")
              .select("narrador_id, tipo, enviado_at")
              .in("narrador_id", enCurso)
              .order("enviado_at", { ascending: false })
              .limit(300),
          ),
      leerLista<NarracionPanel>("las narraciones", () =>
        admin
          .from("narraciones")
          .select("id, narrador_id, estado, actualizada_at, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ),
      leerLista<FotoPanel>("las fotos", () =>
        admin.from("fotos").select("narrador_id").limit(2000),
      ),
      leerLista<ConsumoPanel>("el consumo de IA", () =>
        admin
          .from("consumo_ia")
          .select(
            "fecha, servicio, paso, modelo, proveedor, cuenta, narrador_id, input_tokens, output_tokens, cantidad, unidad, usd",
          )
          .gte("fecha", corte)
          .order("fecha", { ascending: false })
          .limit(3000),
      ),
      leerLista<LatidoPanel>("los latidos", () =>
        admin.from("latidos").select("servicio, ultimo_ping, detalle"),
      ),
      leerLista<GastoPanel>("los gastos a mano", () =>
        admin
          .from("gastos_manuales")
          .select("fecha, concepto, monto, moneda, categoria, quien")
          .gte("fecha", corte)
          .order("fecha", { ascending: false }),
      ),
    ]);

  return {
    narradores,
    familias,
    pedidos,
    respuestas,
    envios,
    narraciones,
    fotos,
    consumo,
    latidos,
    gastos,
  };
}
