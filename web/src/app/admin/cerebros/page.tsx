import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { livenessDeLaVoz, mapaDeCerebros, type EstadoNodo, type Nodo } from "@/lib/admin/mapa";
import { UMBRALES } from "@/lib/admin/frenos";
import { Chip, Leyenda, Nota, Punto, SinDatos, Titulo, cuando, tono } from "../ui";

// 08 · Cerebros — «qué cerebro trabaja, qué hace y dónde se frenó».
// Los 16 nodos salen siempre (un robot que nunca se usó es una caja gris, no una alarma).

const NOMBRE_DEL_MODELO: Record<string, string> = {
  "claude-fable-5": "Fable 5",
  "claude-opus-5": "Opus 5",
  "claude-haiku-4-5": "Haiku 4.5",
  "gpt-transcribe": "gpt-transcribe",
  "gpt-4o-mini-tts": "gpt-4o-mini-tts",
  whisper: "Whisper local",
  qwen3tts: "GPU local",
};

const COLOR: Record<EstadoNodo, "verde" | "ambar" | "rojo" | "neutro"> = {
  trabajando: "verde",
  quieto: "ambar",
  frenado: "rojo",
  sin_uso: "neutro",
};

const CARRILES: { clave: Nodo["carril"]; numero: string; etiqueta: string; donde: string }[] = [
  { clave: "entrevista", numero: "1", etiqueta: "La entrevista", donde: "por WhatsApp" },
  { clave: "libro", numero: "2", etiqueta: "El libro", donde: "en la fábrica" },
  { clave: "voz", numero: "3", etiqueta: "Su voz", donde: "en la computadora de la casa" },
];

function Caja({ nodo, ahora }: { nodo: Nodo; ahora: Date }) {
  return (
    <div
      className={`flex-1 px-3.5 py-3 ${
        nodo.estado === "sin_uso"
          ? "rounded-lg border border-dashed border-[var(--linea-fuerte)]"
          : `adm-hoja adm-hoja--viva adm-filo ${tono(COLOR[nodo.estado])}`
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="pt-1.5">
          <Punto color={COLOR[nodo.estado]} />
        </span>
        <b className="text-sm font-medium leading-tight">{nodo.nombre}</b>
      </div>
      <div className="adm-dato mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--texto-menor)]">
        <span>{NOMBRE_DEL_MODELO[nodo.modelo] ?? (nodo.modelo || "sin modelo")}</span>
        <span className="whitespace-nowrap">{cuando(nodo.cuando, ahora)}</span>
      </div>
    </div>
  );
}

export default async function PantallaCerebros() {
  const ahora = new Date();
  const datos = await datosDelPanel(crearClienteServidor(), ahora);
  const nodos = mapaDeCerebros(datos, ahora);
  const voz = livenessDeLaVoz(datos, ahora);
  const frenados = nodos.filter((n) => n.estado === "frenado");

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/cerebros">
        Cada carril es una etapa de la vida de un libro, y cada caja un robot que hace una sola cosa. La caja se
        pone roja cuando ese robot se pasó del tiempo razonable sin hacer nada: así se ve de un vistazo dónde se
        cortó la cadena, que es lo que importa cuando algo falla.
      </Titulo>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={`adm-hoja adm-filo ${tono(frenados.length > 0 ? "rojo" : "verde")} px-5 py-4`}>
          <p className="adm-micro">La cadena</p>
          {frenados.length > 0 ? (
            <p className="mt-2 font-medium text-[var(--adm-rojo)]">
              {frenados.length === 1
                ? `Se cortó la cadena en «${frenados[0].nombre}».`
                : `Se cortó la cadena en ${frenados.length} lugares: ${frenados.map((n) => `«${n.nombre}»`).join(", ")}.`}
            </p>
          ) : (
            <p className="mt-2 font-medium">Ninguna caja en rojo: la cadena está entera.</p>
          )}
        </div>
        <div className={`adm-hoja adm-filo ${tono(voz.viva ? "verde" : "rojo")} px-5 py-4`}>
          <p className="adm-micro flex flex-wrap items-center gap-2">
            La computadora que narra <Chip color={voz.viva ? "verde" : "rojo"}>{voz.viva ? "viva" : "caída"}</Chip>
          </p>
          <p className="mt-2 text-sm text-[var(--texto-suave)]">{voz.porque}</p>
        </div>
      </div>

      {nodos.length === 0 ? <SinDatos que="Todavía no hay cerebros que mostrar." /> : null}

      <div className="mt-10 flex flex-col gap-8">
        {CARRILES.map((carril) => {
          const deEse = nodos.filter((n) => n.carril === carril.clave);
          return (
            <section key={carril.clave}>
              <h2 className="adm-micro mb-3">
                <span className="flex items-baseline gap-3">
                  <span className="text-2xl normal-case italic tracking-normal text-[var(--texto)] [font-family:var(--fuente-titulo)]">
                    {carril.numero}
                  </span>
                  <span>
                    {carril.etiqueta} · <span className="normal-case tracking-normal">{carril.donde}</span>
                  </span>
                </span>
              </h2>
              {/* La cadena: cada robot le pasa su trabajo al de al lado. */}
              <div className="flex flex-wrap items-stretch gap-y-2">
                {deEse.map((nodo, i) => (
                  <div key={nodo.nombre} className="flex min-w-[196px] flex-1 items-stretch">
                    {i > 0 ? (
                      <span aria-hidden className="flex w-6 shrink-0 items-center justify-center text-[var(--texto-menor)]">
                        →
                      </span>
                    ) : null}
                    <Caja nodo={nodo} ahora={ahora} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8">
        <Leyenda
          items={[
            { color: "verde", texto: "trabajó dentro del tiempo esperado" },
            { color: "ambar", texto: "quieto, y es normal" },
            { color: "rojo", texto: "se pasó del tiempo: acá hay un freno" },
            { color: "neutro", texto: "sin uso todavía" },
          ]}
        />
      </div>

      <h2 className="adm-micro mb-3 mt-12">Cuándo se pone rojo</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="adm-hoja px-5 py-4">
          <b className="block text-3xl font-medium [font-family:var(--fuente-titulo)]">{UMBRALES.vozSinLatidoMinutos} min</b>
          <span className="mt-2 block text-xs leading-snug text-[var(--texto-menor)]">
            sin latir es normal mientras narra un capítulo: por eso también se mira si la narración avanzó
          </span>
        </div>
        <div className="adm-hoja px-5 py-4">
          <b className="block text-3xl font-medium [font-family:var(--fuente-titulo)]">{UMBRALES.latidoSinLatearVeces} vueltas</b>
          <span className="mt-2 block text-xs leading-snug text-[var(--texto-menor)]">
            sin latir se declara caída una máquina que corre siempre (la fábrica y la computadora que narra)
          </span>
        </div>
        <div className="adm-hoja px-5 py-4">
          <b className="block text-3xl font-medium [font-family:var(--fuente-titulo)]">{UMBRALES.vozSinAvanceHoras} hs</b>
          <span className="mt-2 block text-xs leading-snug text-[var(--texto-menor)]">una narración sin avanzar: ahí sí se pone rojo el carril</span>
        </div>
        <div className="adm-hoja px-5 py-4">
          <b className="block text-3xl font-medium [font-family:var(--fuente-titulo)]">{UMBRALES.libroSinArrancarHoras} hs</b>
          <span className="mt-2 block text-xs leading-snug text-[var(--texto-menor)]">un pedido pagado que la fábrica todavía no tomó</span>
        </div>
      </div>

      <Nota>
        El «cuándo» de cada caja sale de la última vez que ese robot llamó a su modelo. Los tres que corren solos
        —la fábrica, el entrevistador y la computadora que narra— avisan cada pocos minutos que están vivos: si uno
        deja de avisar, se pone en rojo aunque no tenga nada que hacer. El entrevistador no se mide por latido
        porque no es un bucle: lo despierta cada mensaje que llega.
      </Nota>
    </div>
  );
}
