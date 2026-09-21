import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { livenessDeLaVoz, mapaDeCerebros, type EstadoNodo, type Nodo } from "@/lib/admin/mapa";
import { UMBRALES } from "@/lib/admin/frenos";
import { Chip, Nota, Punto, SinDatos, Titulo, cuando } from "../ui";

// 05 · Cerebros — «qué cerebro trabaja, qué hace y dónde se frenó».
// Los 14 nodos salen siempre (un robot que nunca se usó es una caja gris, no una alarma).

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

const CARRILES: { clave: Nodo["carril"]; etiqueta: string }[] = [
  { clave: "entrevista", etiqueta: "Carril 1 · la entrevista, por WhatsApp" },
  { clave: "libro", etiqueta: "Carril 2 · el libro, en la fábrica" },
  { clave: "voz", etiqueta: "Carril 3 · Su voz, en la computadora de la casa" },
];

function Caja({ nodo, ahora }: { nodo: Nodo; ahora: Date }) {
  return (
    <div
      className={`min-w-[168px] flex-1 rounded border px-3 py-2 ${
        nodo.estado === "sin_uso" ? "border-dashed border-[var(--linea-fuerte)]" : "border-[var(--linea)] bg-[var(--relieve)]"
      }`}
    >
      <div className="flex items-start gap-1">
        <span className="pt-1.5">
          <Punto color={COLOR[nodo.estado]} />
        </span>
        <b className="text-sm leading-tight">{nodo.nombre}</b>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--texto-menor)]">
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
    <div>
      <Titulo numero="05" nombre="Cerebros" aclara="qué cerebro trabaja, qué hace y dónde se frenó" />

      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--texto-suave)]">
        Cada carril es una etapa de la vida de un libro, y cada caja un robot que hace una sola cosa. La caja se
        pone roja cuando ese robot se pasó del tiempo razonable sin hacer nada: así se ve de un vistazo dónde se
        cortó la cadena, que es lo que importa cuando algo falla.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--texto-menor)]">La computadora que narra:</span>
        <Chip color={voz.viva ? "verde" : "rojo"}>{voz.viva ? "viva" : "caída"}</Chip>
        <span className="text-sm text-[var(--texto-suave)]">{voz.porque}</span>
      </div>

      {frenados.length > 0 ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">
          {frenados.length === 1
            ? `Se cortó la cadena en «${frenados[0].nombre}».`
            : `Se cortó la cadena en ${frenados.length} lugares: ${frenados.map((n) => `«${n.nombre}»`).join(", ")}.`}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--texto-menor)]">Ninguna caja en rojo: la cadena está entera.</p>
      )}

      {nodos.length === 0 ? <SinDatos que="Todavía no hay cerebros que mostrar." /> : null}

      <div className="mt-6 flex flex-col gap-6">
        {CARRILES.map((carril) => {
          const deEse = nodos.filter((n) => n.carril === carril.clave);
          return (
            <section key={carril.clave}>
              <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                {carril.etiqueta}
              </h2>
              <div className="flex flex-wrap gap-2">
                {deEse.map((nodo) => (
                  <Caja key={nodo.nombre} nodo={nodo} ahora={ahora} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--texto-menor)]">
        <span className="flex items-center gap-2"><Punto color="verde" />trabajó dentro del tiempo esperado</span>
        <span className="flex items-center gap-2"><Punto color="ambar" />quieto, y es normal</span>
        <span className="flex items-center gap-2"><Punto color="rojo" />se pasó del tiempo: acá hay un freno</span>
        <span className="flex items-center gap-2"><Punto color="neutro" />sin uso todavía</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-[var(--linea)] px-4 py-3">
          <b className="block text-lg [font-family:var(--fuente-titulo)]">{UMBRALES.vozSinLatidoMinutos} min</b>
          <span className="text-xs text-[var(--texto-menor)]">
            sin latir es normal mientras narra un capítulo: por eso también se mira si la narración avanzó
          </span>
        </div>
        <div className="rounded border border-[var(--linea)] px-4 py-3">
          <b className="block text-lg [font-family:var(--fuente-titulo)]">{UMBRALES.latidoSinLatearVeces} vueltas</b>
          <span className="text-xs text-[var(--texto-menor)]">
            sin latir se declara caída una máquina que corre siempre (la fábrica y la computadora que narra)
          </span>
        </div>
        <div className="rounded border border-[var(--linea)] px-4 py-3">
          <b className="block text-lg [font-family:var(--fuente-titulo)]">{UMBRALES.vozSinAvanceHoras} hs</b>
          <span className="text-xs text-[var(--texto-menor)]">una narración sin avanzar: ahí sí se pone rojo el carril</span>
        </div>
        <div className="rounded border border-[var(--linea)] px-4 py-3">
          <b className="block text-lg [font-family:var(--fuente-titulo)]">{UMBRALES.libroSinArrancarHoras} hs</b>
          <span className="text-xs text-[var(--texto-menor)]">un pedido pagado que la fábrica todavía no tomó</span>
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
