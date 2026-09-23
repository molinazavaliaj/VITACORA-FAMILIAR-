"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AVISO_CALIDAD, EVITAR_MAXIMO, MAXIMO_FAMILIA, NOMBRE_RITMO, RITMOS, calidadDeFoto, idsTrasArrastrar, type CalidadFoto, type PreguntaGuion, type Ritmo } from "@/lib/guion";
import { medirImagen } from "@/lib/medir-imagen";
import { HORAS_FAMILIAR, HORAS_VIAJE, ZONAS, nombreDeZona, type Hora } from "@/lib/horario";

// Las acciones del guion (docs/panel-usuario.md §6). Patrón de la casa: el
// cliente llama a /api/guion o /api/fotos, y al volver refresca la página
// para que el servidor vuelva a leer la verdad.

async function patchGuion(narradorId: string, cuerpo: Record<string, unknown>) {
  const r = await fetch(`/api/guion?narrador=${encodeURIComponent(narradorId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const json = (await r.json().catch(() => ({}))) as { error?: string; ok?: boolean; pregunta?: { id: string } };
  if (!r.ok) throw new Error(json.error ?? "No pudimos guardar el cambio. Intenta de nuevo.");
  return json;
}

async function subirFoto(
  narradorId: string,
  datos: { archivo: File; capitulo: string; epigrafe?: string; principal?: boolean; medida: { ancho: number; alto: number } | null },
) {
  const form = new FormData();
  form.set("archivo", datos.archivo);
  form.set("capitulo", datos.capitulo);
  if (datos.epigrafe) form.set("epigrafe", datos.epigrafe);
  if (datos.principal) form.set("principal", "1");
  if (datos.medida) {
    form.set("ancho", String(datos.medida.ancho));
    form.set("alto", String(datos.medida.alto));
  }
  const r = await fetch(`/api/fotos?narrador=${encodeURIComponent(narradorId)}`, { method: "POST", body: form });
  const json = (await r.json().catch(() => ({}))) as { error?: string; id?: string; calidad?: CalidadFoto | null; aviso?: string | null };
  if (!r.ok || !json.id) throw new Error(json.error ?? "No pudimos subir la foto. Intenta de nuevo.");
  return json as { id: string; calidad: CalidadFoto | null; aviso: string | null };
}

// ── piezas chicas ──────────────────────────────────────────────────────

const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const botonPrincipal = `${boton} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90`;
const botonSecundario = `${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)]`;
const botonChico = "text-sm text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)] disabled:opacity-50";
const campo = "w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-3 text-[16px] leading-relaxed text-[var(--texto)] outline-none focus:border-[var(--texto)]";

// Íconos de línea para los botones redondos del editor. Un solo grosor.
function IconoChico({ nombre }: { nombre: "lapiz" | "arriba" | "abajo" | "x" | "mas" | "check" | "asa" }) {
  const d = {
    lapiz: "M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16zM13 7l4 4",
    asa: "M5 8h14M5 12h14M5 16h14",
    arriba: "M12 19V5M6 11l6-6 6 6",
    abajo: "M12 5v14M6 13l6 6 6-6",
    x: "M6 6l12 12M18 6L6 18",
    mas: "M12 5v14M5 12h14",
    check: "m5 12.5 4.5 4.5L19 7.5",
  }[nombre];
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const botonRedondo = "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--linea-fuerte)] text-[var(--texto-suave)] transition-colors hover:bg-[var(--hueco)] hover:text-[var(--texto)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] disabled:opacity-35 disabled:hover:bg-transparent [touch-action:manipulation]";

function Error_({ mensaje }: { mensaje: string | null }) {
  return mensaje ? <p className="text-sm text-[var(--alerta)]">{mensaje}</p> : null;
}

export const SIN_CAPITULO = ""; // la foto es del libro: tapa, contratapa o marco

function SelectorCapitulo({ capitulos, valor, onChange, conGeneral = false }: { capitulos: string[]; valor: string; onChange: (c: string) => void; conGeneral?: boolean }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)} className={`${campo} [font-family:var(--fuente-micro)] text-[15px]`}>
      {conGeneral ? <option value={SIN_CAPITULO}>Todavía no sé — al álbum del libro</option> : null}
      {capitulos.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}

function VistaPreviaFoto({ archivo, calidad }: { archivo: File | null; calidad: CalidadFoto | null | "sin-medir" }) {
  const [url, setUrl] = useState<string | null>(null);
  const anterior = useRef<File | null>(null);
  if (archivo !== anterior.current) {
    anterior.current = archivo;
    if (url) URL.revokeObjectURL(url);
    setUrl(archivo ? URL.createObjectURL(archivo) : null);
  }
  if (!archivo) return null;
  const aviso = calidad === "sin-medir" ? "No pudimos medir esta foto en el navegador; la revisamos nosotros." : calidad ? AVISO_CALIDAD[calidad] : null;
  const tono = calidad === "baja" ? "text-[var(--alerta)]" : calidad === "marco" ? "text-[var(--texto)]" : "text-[var(--texto-menor)]";
  return (
    <div className="flex items-start gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-24 w-24 shrink-0 rounded-lg border border-[var(--linea)] object-cover" />
      ) : (
        <div className="h-24 w-24 shrink-0 rounded-lg bg-[var(--hueco)]" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-[var(--texto-suave)]">{archivo.name}</p>
        {aviso ? <p className={`mt-1 text-sm leading-snug ${tono}`}>{aviso}</p> : null}
      </div>
    </div>
  );
}

/** Un campo de foto que mide la imagen apenas se elige. Con `multiple`, avisa por cada una. */
function CampoFoto({ onElegir, multiple = false, etiqueta }: { onElegir: (archivo: File, medida: { ancho: number; alto: number } | null) => void; multiple?: boolean; etiqueta?: string }) {
  return (
    <label className={`${botonSecundario} cursor-pointer`}>
      {etiqueta ?? (multiple ? "Elegir fotos" : "Elegir una foto")}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="sr-only"
        onChange={async (e) => {
          const archivos = Array.from(e.target.files ?? []);
          e.target.value = ""; // para poder volver a elegir la misma
          for (const archivo of multiple ? archivos : archivos.slice(0, 1)) onElegir(archivo, await medirImagen(archivo));
        }}
      />
    </label>
  );
}

// ── editar / sacar / reordenar (solo dueña) ────────────────────────────

export function EditorGuion({
  narradorId, futuras, puedeEditar, puedeSaltar, capitulo,
}: { narradorId: string; futuras: PreguntaGuion[]; puedeEditar: boolean; puedeSaltar: boolean; capitulo?: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `futuras` es el guion completo por venir (para reordenar hace falta la
  // lista entera); `capitulo` filtra lo que se muestra en esta sección.
  const editables = futuras.filter((p) => p.tipo !== "adaptativa");
  const visibles = capitulo ? futuras.filter((p) => p.capitulo === capitulo) : futuras;

  async function correr(cuerpo: Record<string, unknown>) {
    setOcupado(true);
    setError(null);
    try {
      await patchGuion(narradorId, cuerpo);
      setEditando(null);
      setConfirmando(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el cambio.");
    } finally {
      setOcupado(false);
    }
  }

  function mover(id: string, direccion: -1 | 1) {
    const ids = editables.map((p) => p.id);
    const i = ids.indexOf(id);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void correr({ accion: "reordenar", ids });
  }

  // Arrastrar y soltar (3t.24): con Pointer Events sirve para mouse y dedo, sin
  // librería. Se agarra del asa; la fila bajo el puntero se marca; al soltar
  // se manda la misma acción `reordenar`. Las flechas quedan como respaldo
  // (accesibilidad, y quien no quiera arrastrar).
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const listaRef = useRef<HTMLOListElement>(null);

  function filaBajo(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-pregunta]");
    return el && listaRef.current?.contains(el) ? el.dataset.pregunta ?? null : null;
  }
  function empezarArrastre(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (ocupado) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrando(id);
    setDestino(null);
  }
  function seguirArrastre(e: React.PointerEvent<HTMLButtonElement>) {
    if (!arrastrando) return;
    e.preventDefault();
    const sobre = filaBajo(e.clientX, e.clientY);
    setDestino(sobre && sobre !== arrastrando ? sobre : null);
  }
  function soltar(e: React.PointerEvent<HTMLButtonElement>) {
    if (!arrastrando) return;
    const sobre = filaBajo(e.clientX, e.clientY);
    const movido = arrastrando;
    setArrastrando(null);
    setDestino(null);
    if (!sobre || sobre === movido) return;
    const ids = idsTrasArrastrar(editables.map((p) => p.id), movido, sobre);
    void correr({ accion: "reordenar", ids });
  }

  if (visibles.length === 0) return null;

  return (
    <ol ref={listaRef} className="flex flex-col gap-3">
      {visibles.map((p) => {
        const esAdaptativa = p.tipo === "adaptativa";
        const enEdicion = editando === p.id;
        const pos = editables.findIndex((q) => q.id === p.id);
        const detalle = [
          p.tipo === "familia" ? "la sumó la familia" : null,
          p.tipo === "sugerida" ? "sugerida por el biógrafo" : null,
          p.foto_id ? "con foto" : null,
          esAdaptativa ? "la escribe el biógrafo con lo que él haya contado" : null,
        ].filter(Boolean).join(" · ");
        return (
          <li
            key={p.id}
            data-pregunta={esAdaptativa ? undefined : p.id}
            className={`grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl border p-4 transition-colors sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 ${
              esAdaptativa ? "border-dashed border-[var(--linea-fuerte)] text-[var(--texto-menor)]" : "border-[var(--linea-fuerte)] bg-[var(--fondo)]"
            } ${arrastrando === p.id ? "opacity-50" : ""} ${destino === p.id ? "border-[var(--acento)] bg-[var(--hueco)]" : ""}`}
          >
            <span className={`text-[22px] leading-[1.2] tabular-nums [font-family:var(--fuente-titulo)] ${esAdaptativa ? "text-[var(--linea-fuerte)]" : "text-[var(--linea-fuerte)]"}`}>{p.orden}</span>
            <div className="min-w-0 flex flex-col gap-2">
              {enEdicion ? (
                <>
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className={campo} autoFocus />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" disabled={ocupado} onClick={() => correr({ accion: "editar", id: p.id, texto })} className={botonPrincipal}>
                      {ocupado ? "Guardando…" : "Guardar"}
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => setEditando(null)} className={botonChico}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <p className={`text-[15px] leading-[1.55] ${esAdaptativa ? "italic" : ""}`}>{p.texto}</p>
                  {detalle ? <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{detalle}</p> : null}
                  {confirmando === p.id ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-[var(--texto-suave)]">¿Sacarla del guion?</span>
                      <button type="button" className={`${botonChico} text-[var(--alerta)]`} disabled={ocupado} onClick={() => correr({ accion: "saltar", id: p.id })}>Sí, sacarla</button>
                      <button type="button" className={botonChico} disabled={ocupado} onClick={() => setConfirmando(null)}>No</button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {puedeEditar && !esAdaptativa && !enEdicion ? (
              <div className="col-start-2 flex gap-1 sm:col-start-3">
                <button
                  type="button"
                  aria-label="Arrastrar para mover"
                  title="Arrastrá para mover"
                  className={`${botonRedondo} cursor-grab [touch-action:none] active:cursor-grabbing`}
                  disabled={ocupado || editables.length < 2}
                  onPointerDown={(e) => empezarArrastre(e, p.id)}
                  onPointerMove={seguirArrastre}
                  onPointerUp={soltar}
                  onPointerCancel={() => { setArrastrando(null); setDestino(null); }}
                >
                  <IconoChico nombre="asa" />
                </button>
                <button type="button" aria-label="Editar" title="Editar" className={botonRedondo} disabled={ocupado} onClick={() => { setEditando(p.id); setTexto(p.texto); setConfirmando(null); }}><IconoChico nombre="lapiz" /></button>
                <button type="button" aria-label="Subir" title="Subir" className={botonRedondo} disabled={ocupado || pos <= 0} onClick={() => mover(p.id, -1)}><IconoChico nombre="arriba" /></button>
                <button type="button" aria-label="Bajar" title="Bajar" className={botonRedondo} disabled={ocupado || pos >= editables.length - 1} onClick={() => mover(p.id, 1)}><IconoChico nombre="abajo" /></button>
                <button type="button" aria-label="Sacar del guion" title={puedeSaltar ? "Sacar" : "Con menos de 15 no alcanza para un libro"} className={botonRedondo} disabled={ocupado || !puedeSaltar} onClick={() => setConfirmando(p.id)}><IconoChico nombre="x" /></button>
              </div>
            ) : null}
          </li>
        );
      })}
      {error ? <li><Error_ mensaje={error} /></li> : null}
    </ol>
  );
}

// ── agregar una pregunta (dueña e invitados) ───────────────────────────

export function AgregarPregunta({
  narradorId, capitulos, lugarLibre, textoInicial = "", capituloInicial, propia = false,
}: { narradorId: string; capitulos: string[]; lugarLibre: number; textoInicial?: string; capituloInicial?: string; propia?: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(Boolean(textoInicial));
  const [modo, setModo] = useState<"escribir" | "foto">("escribir");
  const [texto, setTexto] = useState(textoInicial);
  const [capitulo, setCapitulo] = useState(capituloInicial ?? capitulos[0] ?? "");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [medida, setMedida] = useState<{ ancho: number; alto: number } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  const sinLugar = lugarLibre <= 0;
  const calidad: CalidadFoto | null | "sin-medir" = archivo ? (medida ? calidadDeFoto(medida.ancho, medida.alto) : "sin-medir") : null;

  function elegirModo(m: "escribir" | "foto") {
    setModo(m);
    setError(null);
    if (m === "foto" && !texto) setTexto("¿Qué estaba pasando ese día? Cuénteme todo lo que le venga a la cabeza al ver esta foto.");
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    try {
      let fotoId: string | undefined;
      if (modo === "foto") {
        if (!archivo) throw new Error("Elegí la foto que le querés mostrar.");
        const subida = await subirFoto(narradorId, { archivo, capitulo, medida });
        fotoId = subida.id;
      }
      await patchGuion(narradorId, { accion: "agregar", texto, capitulo, fotoId });
      setListo(modo === "foto" ? "Listo: la foto y su pregunta van al final del guion." : "Listo: la pregunta va al final del guion.");
      setTexto("");
      setArchivo(null);
      setMedida(null);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(false);
    }
  }

  if (!abierto) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={sinLugar}
          onClick={() => { setAbierto(true); setListo(null); }}
          className="flex w-full items-center gap-4 rounded-xl border border-[var(--acento)] bg-[var(--fondo)] px-5 py-4 text-left transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)] disabled:opacity-50 [touch-action:manipulation]"
        >
          <span className="text-[var(--acento)]"><IconoChico nombre="mas" /></span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium [font-family:var(--fuente-micro)]">Agregar una pregunta</span>
            <span className="text-sm text-[var(--texto-menor)]">
              {sinLugar ? "El guion está completo. Para sumar una, sacá otra." : `Con o sin foto, al capítulo que elijas. Lugar libre: ${lugarLibre} de ${MAXIMO_FAMILIA}.`}
            </span>
          </span>
          <span aria-hidden className="text-[var(--acento)]">→</span>
        </button>
        {listo ? <p className="text-sm text-[var(--texto-suave)]">{listo}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--texto)] p-6">
      <div className="flex gap-2">
        {(["escribir", "foto"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => elegirModo(m)}
            className={`${boton} ${modo === m ? "bg-[var(--texto)] text-[var(--fondo)]" : "border border-[var(--linea-fuerte)] text-[var(--texto)]"}`}
          >
            {m === "escribir" ? "Escribir una pregunta" : "Con una foto"}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {modo === "foto" ? (
          <>
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
              {propia ? "El biógrafo te manda la foto por WhatsApp con la pregunta. Lo que cuentes entra al libro junto con la foto." : "El biógrafo le manda la foto por WhatsApp con tu pregunta. Lo que cuente entra al libro junto con la foto."}
            </p>
            <CampoFoto onElegir={(a, m) => { setArchivo(a); setMedida(m); }} />
            <VistaPreviaFoto archivo={archivo} calidad={calidad} />
          </>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
            {modo === "foto" ? "Qué le preguntamos sobre la foto" : "La pregunta"}
          </span>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className={campo} placeholder="Cuénteme de aquel verano en la casa de la tía Rosa…" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">En qué capítulo va</span>
          <SelectorCapitulo capitulos={capitulos} valor={capitulo} onChange={setCapitulo} />
        </label>

        <Error_ mensaje={error} />

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={botonPrincipal} disabled={ocupado} onClick={guardar}>
            {ocupado ? "Guardando…" : "Agregar al guion"}
          </button>
          <button type="button" className={botonChico} disabled={ocupado} onClick={() => { setAbierto(false); setError(null); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── sugerime preguntas (spec §6.2, tercer botón) ───────────────────────

type Sugerida = { texto: string; capitulo: string };

export function SugerirPreguntas({ narradorId, lugarLibre, propia = false }: { narradorId: string; lugarLibre: number; propia?: boolean }) {
  const router = useRouter();
  const [sugeridas, setSugeridas] = useState<Sugerida[] | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [agregando, setAgregando] = useState<number | null>(null);
  const [agregadas, setAgregadas] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sinLugar = lugarLibre - agregadas.size <= 0;

  async function pedir() {
    setPidiendo(true);
    setError(null);
    try {
      const r = await fetch(`/api/sugeridas?narrador=${encodeURIComponent(narradorId)}`, { method: "POST" });
      const j = (await r.json().catch(() => ({}))) as { sugeridas?: Sugerida[]; error?: string };
      if (!r.ok || !j.sugeridas) throw new Error(j.error ?? "No pudimos armar las sugerencias.");
      setSugeridas(j.sugeridas);
      setAgregadas(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos armar las sugerencias.");
    } finally {
      setPidiendo(false);
    }
  }

  async function agregar(i: number, s: Sugerida) {
    setAgregando(i);
    setError(null);
    try {
      await patchGuion(narradorId, { accion: "agregar", texto: s.texto, capitulo: s.capitulo, tipo: "sugerida" });
      setAgregadas((prev) => new Set(prev).add(i));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos agregarla.");
    } finally {
      setAgregando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pidiendo || sinLugar}
        onClick={pedir}
        className="flex w-full items-center gap-4 rounded-xl border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-5 py-4 text-left transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] disabled:opacity-50 [touch-action:manipulation]"
      >
        <span className="text-[var(--texto-suave)]">
          {pidiendo ? (
            <span aria-hidden className="block h-4 w-4 animate-spin rounded-full border-2 border-[var(--texto)] border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium [font-family:var(--fuente-micro)]">{sugeridas ? "Pedirle otras cinco" : "Sugerime preguntas"}</span>
          <span className="text-sm text-[var(--texto-menor)]">
            {sinLugar
              ? "El guion está completo. Para sumar una, sacá otra."
              : pidiendo
                ? `El biógrafo está releyendo todo lo que ${propia ? "contaste" : "contó"}. Tarda medio minuto.`
                : `El biógrafo propone cinco, con lo que ${propia ? "contaste" : "él contó"} hasta hoy. Vos elegís cuáles entran.`}
          </span>
        </span>
      </button>

      {sugeridas ? (
        <ol className="flex flex-col gap-2">
          {sugeridas.map((s, i) => {
            const puesta = agregadas.has(i);
            return (
              <li key={i} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-5 py-4 ${puesta ? "border-[var(--linea)] text-[var(--texto-menor)]" : "border-dashed border-[var(--linea-fuerte)]"}`}>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="text-[15px] leading-[1.55]">{s.texto}</p>
                  <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{s.capitulo}</p>
                </div>
                {puesta ? (
                  <span className="text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Agregada ✓</span>
                ) : (
                  <button type="button" className={`${boton} h-9 px-4 border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)]`} disabled={agregando !== null || sinLugar} onClick={() => agregar(i, s)}>
                    {agregando === i ? "Agregando…" : "Agregar"}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
      <Error_ mensaje={error} />
    </div>
  );
}

// ── subir una foto suelta a un capítulo ────────────────────────────────

type FotoElegida = { clave: string; archivo: File; medida: { ancho: number; alto: number } | null };
const FOTOS_POR_VEZ = 20;

export function SubirFoto({ narradorId, capitulos, capituloInicial, children, variante = "texto" }: { narradorId: string; capitulos: string[]; capituloInicial?: string; children?: ReactNode; variante?: "texto" | "barra" }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // Desde la barra (sin capítulo inicial) la foto es del libro por defecto; se puede mandar a un capítulo.
  const esGeneral = capituloInicial === undefined;
  const [capitulo, setCapitulo] = useState(capituloInicial ?? (esGeneral ? SIN_CAPITULO : capitulos[0] ?? ""));
  const [epigrafe, setEpigrafe] = useState("");
  const [principal, setPrincipal] = useState(false);
  // Varias de una (Joaquín, 18/09): todas van al mismo destino. El epígrafe y
  // "que abra el capítulo" son de UNA foto: solo se ofrecen cuando hay una sola.
  const [elegidas, setElegidas] = useState<FotoElegida[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const unaSola = elegidas.length === 1;

  function agregar(archivo: File, medida: { ancho: number; alto: number } | null) {
    const clave = `${archivo.name}-${archivo.size}-${archivo.lastModified}`;
    setElegidas((x) => (x.some((f) => f.clave === clave) || x.length >= FOTOS_POR_VEZ ? x : [...x, { clave, archivo, medida }]));
  }

  async function guardar() {
    if (elegidas.length === 0) { setError("Elegí al menos una foto."); return; }
    setError(null);
    const pendientes = [...elegidas];
    let subidas = 0;
    let ultimoAviso: string | null = null;
    for (const foto of pendientes) {
      setOcupado(pendientes.length > 1 ? `Subiendo ${subidas + 1} de ${pendientes.length}…` : "Subiendo…");
      try {
        const r = await subirFoto(narradorId, {
          archivo: foto.archivo, capitulo, medida: foto.medida,
          epigrafe: unaSola ? epigrafe : undefined, principal: unaSola ? principal : false,
        });
        subidas++;
        ultimoAviso = r.aviso;
        setElegidas((x) => x.filter((f) => f.clave !== foto.clave)); // las que ya entraron no se repiten si falla otra
      } catch (e) {
        setOcupado(null);
        setError(`${e instanceof Error ? e.message : "No pudimos subir la foto."} (${foto.archivo.name}). Las ${subidas} anteriores ya quedaron.`);
        router.refresh();
        return;
      }
    }
    setOcupado(null);
    setAviso(subidas === 1 ? (ultimoAviso ? `Foto guardada. ${ultimoAviso}` : "Foto guardada.") : `${subidas} fotos guardadas.`);
    setEpigrafe(""); setPrincipal(false);
    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={variante === "barra" ? `${botonSecundario} gap-2 px-4 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)]` : botonChico}
          onClick={() => { setAbierto(true); setAviso(null); }}
        >
          {children ?? "+ Subir fotos"}
        </button>
        {aviso ? <p className="text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--texto)] p-6">
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
          Si es una foto de papel: apoyala en una mesa, con luz de día, sin flash y sin sombra encima. Se guarda tal cual la subís. Podés elegir varias de una.
        </p>
        <CampoFoto multiple onElegir={agregar} etiqueta={elegidas.length > 0 ? "Agregar más" : undefined} />
        {elegidas.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {elegidas.map((f) => (
              <li key={f.clave} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <VistaPreviaFoto archivo={f.archivo} calidad={f.medida ? calidadDeFoto(f.medida.ancho, f.medida.alto) : "sin-medir"} />
                </div>
                <button type="button" aria-label={`Sacar ${f.archivo.name}`} disabled={ocupado !== null} onClick={() => setElegidas((x) => x.filter((g) => g.clave !== f.clave))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--linea-fuerte)] text-[var(--texto-menor)] hover:text-[var(--texto)] disabled:opacity-50">×</button>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Dónde {elegidas.length > 1 ? "van" : "va"}</span>
          <SelectorCapitulo capitulos={capitulos} valor={capitulo} onChange={setCapitulo} conGeneral={esGeneral} />
          {capitulo === SIN_CAPITULO ? (
            <span className="text-sm text-[var(--texto-menor)]">{elegidas.length > 1 ? "Quedan" : "Queda"} en el álbum del libro, sin lugar todavía. Después, en Encargar libro, {elegidas.length > 1 ? "las ponés" : "la ponés"} donde quieras: la portada de un capítulo, la tapa, la contratapa o un marco.</span>
          ) : null}
        </label>
        {unaSola ? (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Epígrafe (opcional)</span>
            <input value={epigrafe} onChange={(e) => setEpigrafe(e.target.value)} className={campo} placeholder="Mar del Plata, verano del 68" maxLength={300} />
          </label>
        ) : elegidas.length > 1 ? (
          <p className="text-sm text-[var(--texto-menor)]">El epígrafe de cada una se pone después, desde la galería.</p>
        ) : null}
        {unaSola && capitulo !== SIN_CAPITULO ? (
          <label className="flex items-center gap-3 text-[15px]">
            <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} className="h-4 w-4" />
            Que abra el capítulo (la foto principal)
          </label>
        ) : null}
        <Error_ mensaje={error} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={botonPrincipal} disabled={ocupado !== null} onClick={guardar}>
            {ocupado ?? (elegidas.length > 1 ? `Guardar las ${elegidas.length} fotos` : "Guardar la foto")}
          </button>
          <button type="button" className={botonChico} disabled={ocupado !== null} onClick={() => { setAbierto(false); setError(null); setElegidas([]); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── ritmo y temas a evitar (solo dueña) ────────────────────────────────

// `sinRitmo`: en viaje (3t.19) el bot escribe una vez por noche, no hay ritmo que elegir.
// `horario` (3t.23): a qué hora y en qué zona le llega la pregunta; se ve y se
// cambia acá. Rige desde el próximo envío (el scheduler lo lee en cada corrida).
// `trato` (3t.22): usted o vos. Editable solo hasta la primera pregunta; después
// se muestra en gris con el porqué. Sin valor: lo decide el biógrafo con la ficha.
export function Ajustes({ narradorId, ritmo, evitar, sinRitmo = false, horario, propia = false, trato, pedirFotos, objetos = [] }: {
  narradorId: string;
  ritmo: Ritmo;
  evitar: string;
  sinRitmo?: boolean;
  /** «Sus objetos preciados» (3t.30). undefined = no se ofrece (Vitácora de viaje). */
  pedirFotos?: boolean;
  /** Los ocho pedidos, para que la familia vea exactamente qué se le va a pedir. */
  objetos?: { orden: number; capitulo: string; texto: string }[];
  horario?: { hora: string; zona: string };
  /** "te llega" en vez de "le llega": autobiografía o viaje. */
  propia?: boolean;
  trato?: { valor: "usted" | "vos" | null; editable: boolean };
}) {
  const router = useRouter();
  const [textoEvitar, setTextoEvitar] = useState(evitar);
  const [tratoElegido, setTratoElegido] = useState<"usted" | "vos" | null>(trato?.valor ?? null);
  const [fotos, setFotos] = useState(pedirFotos ?? true);
  const [hora, setHora] = useState(horario?.hora ?? "");
  const [zona, setZona] = useState(horario?.zona ?? "");
  // La lista base según el producto; si la hora guardada no está en la lista
  // (un piloto a mano, o la compra vieja), se agrega para que se vea tal cual.
  const horasBase: Hora[] = sinRitmo ? HORAS_VIAJE : HORAS_FAMILIAR;
  const horas: Hora[] = horario && !horasBase.some((h) => h.valor === horario.hora) ? [{ valor: horario.hora, nombre: `${horario.hora} (la actual)` }, ...horasBase] : horasBase;
  const zonas: [string, string][] = horario && !ZONAS.some(([z]) => z === horario.zona) ? [[horario.zona, horario.zona], ...ZONAS] : ZONAS;
  const horarioCambio = Boolean(horario) && (hora !== horario!.hora || zona !== horario!.zona);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null); // qué bloque se guardó recién

  async function correr(clave: string, cuerpo: Record<string, unknown>) {
    setOcupado(clave);
    setError(null);
    setGuardado(null);
    try {
      await patchGuion(narradorId, cuerpo);
      setGuardado(clave);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {sinRitmo ? null : (
      <fieldset>
        <legend className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Ritmo</legend>
        <div className="mt-3 flex flex-col gap-2">
          {RITMOS.map((r) => (
            <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${ritmo === r ? "border-[var(--texto)]" : "border-[var(--linea)] hover:border-[var(--linea-fuerte)]"}`}>
              <input type="radio" name="ritmo" value={r} checked={ritmo === r} disabled={ocupado !== null} onChange={() => correr("ritmo", { accion: "ritmo", ritmo: r })} className="mt-1" />
              <span>
                <span className="block text-[16px] [font-family:var(--fuente-titulo)]">{NOMBRE_RITMO[r].titulo}</span>
                <span className="block text-sm text-[var(--texto-menor)]">{NOMBRE_RITMO[r].detalle}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--texto-menor)]">Además, al terminar cada respuesta el biógrafo le ofrece seguir con la siguiente. Él también marca su ritmo.</p>
      </fieldset>
      )}

      {trato ? (
        <fieldset disabled={!trato.editable || ocupado !== null} className={trato.editable ? "" : "opacity-60"}>
          <legend className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">{propia ? "Cómo te habla el biógrafo" : "Cómo le habla el biógrafo"}</legend>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">
            {trato.valor ? <>Hoy: <strong className="font-medium text-[var(--texto)]">de {trato.valor}</strong>.</> : "Hoy: lo decide el biógrafo con la ficha (la edad manda)."}{" "}
            {trato.editable ? "Se puede cambiar hasta la primera pregunta." : "Se fijó con la primera pregunta: ya no se cambia, para que suene siempre igual."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Trato">
            {(["usted", "vos"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={tratoElegido === t} onClick={() => setTratoElegido(t)} className={`rounded-full border px-4 py-2 text-[14px] transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] disabled:cursor-not-allowed ${tratoElegido === t ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : "border-[var(--linea-fuerte)] text-[var(--texto)] hover:border-[var(--texto)]"}`}>
                De {t}
              </button>
            ))}
            <button type="button" className={`${botonSecundario} ml-2`} disabled={!tratoElegido || tratoElegido === trato.valor} onClick={() => tratoElegido && correr("trato", { accion: "trato", trato: tratoElegido })}>
              {ocupado === "trato" ? "Guardando…" : "Guardar el trato"}
            </button>
            {guardado === "trato" && tratoElegido === trato.valor ? <span className="text-sm text-[var(--texto-menor)]">Guardado</span> : null}
          </div>
        </fieldset>
      ) : null}

      {horario ? (
        <fieldset>
          <legend className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">{propia ? "A qué hora te llega la pregunta" : "A qué hora le llega la pregunta"}</legend>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">
            Hoy: <strong className="font-medium text-[var(--texto)]">{horario.hora}</strong>, hora de {nombreDeZona(horario.zona)}. {propia ? "Si querés que te llegue antes o después" : "Si conviene que le llegue antes o después"}, cambiala acá: vale desde la próxima.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">Hora</span>
              <select value={hora} onChange={(e) => setHora(e.target.value)} disabled={ocupado !== null} className={campo}>
                {horas.map((h) => <option key={h.valor} value={h.valor}>{h.nombre}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">Hora de dónde</span>
              <select value={zona} onChange={(e) => setZona(e.target.value)} disabled={ocupado !== null} className={campo}>
                {zonas.map(([z, n]) => <option key={z} value={z}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className={botonSecundario} disabled={ocupado !== null || !horarioCambio} onClick={() => correr("horario", { accion: "horario", hora, zona })}>
              {ocupado === "horario" ? "Guardando…" : "Guardar la hora"}
            </button>
            {guardado === "horario" && !horarioCambio ? <span className="text-sm text-[var(--texto-menor)]">Guardado</span> : null}
          </div>
        </fieldset>
      ) : null}

      {pedirFotos === undefined ? null : (
        <fieldset>
          <legend className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">{propia ? "Fotos de tus cosas" : "Fotos de sus cosas"}</legend>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">
            Al terminar cada capítulo {propia ? "te pedimos" : "le pedimos"} la foto de algo {propia ? "tuyo" : "suyo"} —el primer reloj, un amuleto, la mascota, el mueble que no {propia ? "tirarías" : "tiraría"}— y que cuente de dónde salió. Son ocho en todo el libro, y quedan en la página del capítulo.
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--linea)] p-4 transition-colors hover:border-[var(--linea-fuerte)]">
            <input
              type="checkbox"
              checked={fotos}
              disabled={ocupado !== null}
              onChange={(e) => { setFotos(e.target.checked); correr("fotos", { accion: "fotos", pedirFotos: e.target.checked }); }}
              className="mt-1"
            />
            <span>
              <span className="block text-[16px] [font-family:var(--fuente-titulo)]">{propia ? "Pedirme fotos de mis cosas" : "Pedirle fotos de sus cosas"}</span>
              <span className="block text-sm text-[var(--texto-menor)]">
                Si {propia ? "no te" : "no le"} resulta fácil sacar una foto y mandarla, {propia ? "apagalo" : "apagalo"}: nunca {propia ? "te" : "le"} vamos a pedir ninguna y la entrevista sigue igual.
              </span>
            </span>
          </label>
          {objetos.length > 0 ? (
            <details className="mt-3 rounded-lg border border-[var(--linea)] p-4">
              <summary className="cursor-pointer text-[15px] [font-family:var(--fuente-micro)]">Ver las {objetos.length} que le vamos a pedir</summary>
              <ul className="mt-3 flex flex-col gap-3">
                {objetos.map((o) => (
                  <li key={o.orden}>
                    <span className="block text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{o.capitulo}</span>
                    <span className="mt-1 block text-[15px] leading-relaxed text-[var(--texto-suave)]">{o.texto}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-[var(--texto-menor)]">Se piden una sola vez, al terminar cada capítulo. Si no contesta, no insistimos.</p>
            </details>
          ) : null}
          {guardado === "fotos" ? <p className="mt-2 text-sm text-[var(--texto-menor)]">Guardado</p> : null}
        </fieldset>
      )}

      <div>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Temas que no se preguntan</span>
          <textarea value={textoEvitar} onChange={(e) => setTextoEvitar(e.target.value)} rows={3} className={campo} placeholder="Por ejemplo: no preguntar por su hermano Rubén. No hablar del accidente del 92." maxLength={EVITAR_MAXIMO} />
        </label>
        <p className="mt-2 text-sm text-[var(--texto-menor)]">El biógrafo lo tiene presente en todas sus preguntas.</p>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" className={botonSecundario} disabled={ocupado !== null || textoEvitar === evitar} onClick={() => correr("evitar", { accion: "evitar", texto: textoEvitar })}>
            {ocupado === "evitar" ? "Guardando…" : "Guardar"}
          </button>
          {guardado === "evitar" ? <span className="text-sm text-[var(--texto-menor)]">Guardado</span> : null}
        </div>
      </div>
      <Error_ mensaje={error} />
    </div>
  );
}
