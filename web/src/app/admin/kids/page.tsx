import { crearClienteServidor } from "@/lib/supabase/servidor";
import { chicosKids, gravedad, marcasOrdenadas, type ChicoKids } from "@/lib/admin/kids";
import { tituloCapitulo } from "@/lib/kids-panel";
import { Barra, Chip, Cifra, Nota, SinDatos, Titulo, cuando, fechaCorta, tono, type Color } from "../ui";

// 04 · Kids — «cómo va cada chico y qué marcó el motor». Lo preocupante
// primero. Las marcas (CONTRATO, `kids_v2.marcas`) las agrega el entrevistador
// y también le llegan por mail a los socios; los padres no las ven.

const MOTIVO: Record<string, { texto: string; color: Color }> = {
  preocupante: { texto: "algo preocupante", color: "rojo" },
  "silencio-8-dias": { texto: "8 días sin contestar", color: "ambar" },
  "cerro-sin-respuesta": { texto: "cerró sin respuesta", color: "ambar" },
  "escribio-despues-del-final": { texto: "escribió después del final", color: "neutro" },
};

function colorDe(c: ChicoKids): Color {
  const g = gravedad(c);
  return g === 0 ? "rojo" : g <= 2 ? "ambar" : g < 9 ? "neutro" : "verde";
}

function comoVa(c: ChicoKids): string {
  if (c.terminoAt || c.avance.terminado) return `terminó de contar${c.terminoAt ? ` el ${fechaCorta(c.terminoAt)}` : ""}`;
  if (c.estado === "pendiente_pago") return "sin pagar";
  if (!c.empezoAt) return "todavía no arrancó";
  const cap = c.avance.capitulo ?? 0;
  return cap < 1 ? "esperando el «Dale, vamos»" : `parte ${cap} de 5 · ${tituloCapitulo(cap) ?? ""}`;
}

export default async function PantallaKids() {
  const ahora = new Date();
  const { chicos, tabla, error } = await chicosKids(crearClienteServidor());

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/kids">
        Primero lo preocupante, después los silencios. Las marcas también llegan por mail a los socios; los padres no
        las ven.
      </Titulo>

      {tabla && !error && chicos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Cifra etiqueta="Chicos" valor={chicos.length} detalle={`${chicos.filter((c) => c.terminoAt || c.avance.terminado).length} ya terminaron de contar`} />
          <Cifra
            etiqueta="Algo preocupante"
            valor={chicos.filter((c) => colorDe(c) === "rojo").length}
            color={chicos.some((c) => colorDe(c) === "rojo") ? "rojo" : "verde"}
            detalle="lo que marcó el motor: hay que leerlo hoy"
          />
          <Cifra
            etiqueta="Con silencios"
            valor={chicos.filter((c) => colorDe(c) === "ambar").length}
            color={chicos.some((c) => colorDe(c) === "ambar") ? "ambar" : "verde"}
            detalle="días sin contestar o cerró sin respuesta"
          />
        </div>
      ) : null}

      {!tabla ? (
        <div>
          <SinDatos que="La tabla kids_v2 todavía no existe (migración 20261016000000 sin aplicar)." />
        </div>
      ) : error ? (
        <div>
          <SinDatos que={`No se pudo leer kids_v2: ${error}`} />
        </div>
      ) : chicos.length === 0 ? (
        <div>
          <SinDatos que="Todavía no hay ningún chico de Kids." />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-2">
          {chicos.map((c) => {
            const cap = c.avance.capitulo ?? 0;
            return (
              <div key={c.narradorId} className={`adm-hoja adm-hoja--viva adm-filo ${tono(colorDe(c))} grid gap-4 px-5 py-4 lg:grid-cols-[1fr_1.2fr_1.6fr] lg:items-start`}>
                <div>
                  <b className="block text-lg font-medium leading-tight [font-family:var(--fuente-titulo)]">{c.nombre ?? "Sin nombre"}</b>
                  <span className="text-xs text-[var(--texto-menor)]">
                    {c.comoLeDicen ? `le dicen ${c.comoLeDicen} · ` : ""}canal {c.canal === "A" ? "A (su WhatsApp)" : "B (lo hace el padre)"}
                  </span>
                </div>
                <div>
                  <Barra proporcion={c.terminoAt || c.avance.terminado ? 1 : cap / 5} />
                  <span className="mt-1.5 block text-xs text-[var(--texto-menor)]">
                    {comoVa(c)} · {c.ultimaRespuestaAt ? `contestó ${cuando(c.ultimaRespuestaAt, ahora)}` : "todavía no contestó"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {c.marcas.length === 0 ? (
                    <Chip color={colorDe(c)}>sin marcas</Chip>
                  ) : (
                    marcasOrdenadas(c.marcas).map((m, i) => (
                      <div key={`${m.motivo}-${m.at}-${i}`} className="text-sm">
                        <Chip color={MOTIVO[m.motivo]?.color ?? "neutro"}>{MOTIVO[m.motivo]?.texto ?? m.motivo}</Chip>
                        <span className="ml-2 text-xs text-[var(--texto-menor)]">{fechaCorta(m.at, true)}</span>
                        {m.detalle ? <p className="mt-0.5 text-[var(--texto-suave)]">{m.detalle}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Nota>Sólo lectura. Lo que cuenta cada chico se ve en su panel (/tablero/&lt;id&gt;), con la cuenta de quien compró.</Nota>
    </div>
  );
}
