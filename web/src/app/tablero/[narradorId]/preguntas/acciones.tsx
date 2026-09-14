"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AVISO_CALIDAD, MAXIMO_FAMILIA, RITMOS, calidadDeFoto, type CalidadFoto, type PreguntaGuion, type Ritmo } from "@/lib/guion";

// Las acciones del guion (docs/panel-usuario.md §6). Patrón de la casa: el
// cliente llama a /api/guion o /api/fotos, y al volver refresca la página
// para que el servidor vuelva a leer la verdad.

const NOMBRE_RITMO: Record<Ritmo, { titulo: string; detalle: string }> = {
  diario: { titulo: "Una por día", detalle: "A su hora, todos los días. Es el ritmo que más gente termina." },
  dos_por_dia: { titulo: "Dos por día", detalle: "Una a la mañana y otra a la tarde. Para quien tiene ganas de contar." },
  seguido: { titulo: "Apenas responde", detalle: "En cuanto termina una, le llega la siguiente. Puede terminar en pocos días." },
};

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

async function medirImagen(archivo: File): Promise<{ ancho: number; alto: number } | null> {
  try {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    return { ancho: img.naturalWidth, alto: img.naturalHeight };
  } catch {
    return null; // si el navegador no la decodifica se sube igual, sin medir (el servidor valida el tipo)
  }
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
function IconoChico({ nombre }: { nombre: "lapiz" | "arriba" | "abajo" | "x" | "mas" | "check" }) {
  const d = {
    lapiz: "M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16zM13 7l4 4",
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

/** Un campo de foto que mide la imagen apenas se elige. */
function CampoFoto({ onElegir }: { onElegir: (archivo: File, medida: { ancho: number; alto: number } | null) => void }) {
  return (
    <label className={`${botonSecundario} cursor-pointer`}>
      Elegir una foto
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={async (e) => {
          const archivo = e.target.files?.[0];
          if (!archivo) return;
          onElegir(archivo, await medirImagen(archivo));
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

  if (visibles.length === 0) return null;

  return (
    <ol className="flex flex-col gap-3">
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
            className={`grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl border p-4 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 ${
              esAdaptativa ? "border-dashed border-[var(--linea-fuerte)] text-[var(--texto-menor)]" : "border-[var(--linea-fuerte)] bg-[var(--fondo)]"
            }`}
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

// ── subir una foto suelta a un capítulo ────────────────────────────────

export function SubirFoto({ narradorId, capitulos, capituloInicial, children, variante = "texto" }: { narradorId: string; capitulos: string[]; capituloInicial?: string; children?: ReactNode; variante?: "texto" | "barra" }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // Desde la barra (sin capítulo inicial) la foto es del libro por defecto; se puede mandar a un capítulo.
  const esGeneral = capituloInicial === undefined;
  const [capitulo, setCapitulo] = useState(capituloInicial ?? (esGeneral ? SIN_CAPITULO : capitulos[0] ?? ""));
  const [epigrafe, setEpigrafe] = useState("");
  const [principal, setPrincipal] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [medida, setMedida] = useState<{ ancho: number; alto: number } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const calidad: CalidadFoto | null | "sin-medir" = archivo ? (medida ? calidadDeFoto(medida.ancho, medida.alto) : "sin-medir") : null;

  async function guardar() {
    if (!archivo) { setError("Elegí una foto."); return; }
    setOcupado(true);
    setError(null);
    try {
      const r = await subirFoto(narradorId, { archivo, capitulo, epigrafe, principal, medida });
      setAviso(r.aviso ? `Foto guardada. ${r.aviso}` : "Foto guardada.");
      setArchivo(null); setMedida(null); setEpigrafe(""); setPrincipal(false);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir la foto.");
    } finally {
      setOcupado(false);
    }
  }

  if (!abierto) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={variante === "barra" ? `${botonSecundario} gap-2 px-4 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)]` : botonChico}
          onClick={() => { setAbierto(true); setAviso(null); }}
        >
          {children ?? "+ Subir una foto"}
        </button>
        {aviso ? <p className="text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--texto)] p-6">
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
          Si es una foto de papel: apoyala en una mesa, con luz de día, sin flash y sin sombra encima. Se guarda tal cual la subís.
        </p>
        <CampoFoto onElegir={(a, m) => { setArchivo(a); setMedida(m); }} />
        <VistaPreviaFoto archivo={archivo} calidad={calidad} />
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Dónde va</span>
          <SelectorCapitulo capitulos={capitulos} valor={capitulo} onChange={setCapitulo} conGeneral={esGeneral} />
          {capitulo === SIN_CAPITULO ? (
            <span className="text-sm text-[var(--texto-menor)]">Queda en el álbum del libro, sin lugar todavía. Después, en Encargar libro, la arrastrás a donde quieras: la portada de un capítulo, la tapa, la contratapa o un marco.</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Epígrafe (opcional)</span>
          <input value={epigrafe} onChange={(e) => setEpigrafe(e.target.value)} className={campo} placeholder="Mar del Plata, verano del 68" maxLength={300} />
        </label>
        {capitulo !== SIN_CAPITULO ? (
          <label className="flex items-center gap-3 text-[15px]">
            <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} className="h-4 w-4" />
            Que abra el capítulo (la foto principal)
          </label>
        ) : null}
        <Error_ mensaje={error} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={botonPrincipal} disabled={ocupado} onClick={guardar}>{ocupado ? "Subiendo…" : "Guardar la foto"}</button>
          <button type="button" className={botonChico} disabled={ocupado} onClick={() => { setAbierto(false); setError(null); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── ritmo y temas a evitar (solo dueña) ────────────────────────────────

export function Ajustes({ narradorId, ritmo, evitar }: { narradorId: string; ritmo: Ritmo; evitar: string }) {
  const router = useRouter();
  const [textoEvitar, setTextoEvitar] = useState(evitar);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function correr(clave: string, cuerpo: Record<string, unknown>) {
    setOcupado(clave);
    setError(null);
    setGuardado(false);
    try {
      await patchGuion(narradorId, cuerpo);
      setGuardado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
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

      <div>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Temas que no se preguntan</span>
          <textarea value={textoEvitar} onChange={(e) => setTextoEvitar(e.target.value)} rows={3} className={campo} placeholder="Por ejemplo: no preguntar por su hermano Rubén. No hablar del accidente del 92." maxLength={1000} />
        </label>
        <p className="mt-2 text-sm text-[var(--texto-menor)]">El biógrafo lo tiene presente en todas sus preguntas.</p>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" className={botonSecundario} disabled={ocupado !== null || textoEvitar === evitar} onClick={() => correr("evitar", { accion: "evitar", texto: textoEvitar })}>
            {ocupado === "evitar" ? "Guardando…" : "Guardar"}
          </button>
          {guardado ? <span className="text-sm text-[var(--texto-menor)]">Guardado</span> : null}
        </div>
      </div>
      <Error_ mensaje={error} />
    </div>
  );
}
