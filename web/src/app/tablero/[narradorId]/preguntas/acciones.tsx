"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AVISO_CALIDAD, RITMOS, calidadDeFoto, type CalidadFoto, type PreguntaGuion, type Ritmo } from "@/lib/guion";

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
const botonPrincipal = `${boton} bg-[var(--acento)] text-white hover:opacity-90`;
const botonSecundario = `${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--bruma)]`;
const botonChico = "text-sm text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)] disabled:opacity-50";
const campo = "w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-3 text-[16px] leading-relaxed text-[var(--texto)] outline-none focus:border-[var(--texto)]";

function Error_({ mensaje }: { mensaje: string | null }) {
  return mensaje ? <p className="text-sm text-red-700">{mensaje}</p> : null;
}

function SelectorCapitulo({ capitulos, valor, onChange }: { capitulos: string[]; valor: string; onChange: (c: string) => void }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)} className={`${campo} [font-family:var(--fuente-micro)] text-[15px]`}>
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
  const tono = calidad === "baja" ? "text-red-700" : calidad === "marco" ? "text-[var(--texto)]" : "text-[var(--texto-menor)]";
  return (
    <div className="flex items-start gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-24 w-24 shrink-0 rounded-lg border border-[var(--linea)] object-cover" />
      ) : (
        <div className="h-24 w-24 shrink-0 rounded-lg bg-[var(--bruma)]" />
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
  narradorId, futuras, puedeEditar, puedeSaltar,
}: { narradorId: string; futuras: PreguntaGuion[]; puedeEditar: boolean; puedeSaltar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editables = futuras.filter((p) => p.tipo !== "adaptativa");

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

  return (
    <ol className="mt-4 flex flex-col gap-3">
      {futuras.map((p, i) => {
        const esAdaptativa = p.tipo === "adaptativa";
        const enEdicion = editando === p.id;
        const pos = editables.findIndex((q) => q.id === p.id);
        return (
          <li key={p.id} className="flex gap-4">
            <span className="w-6 shrink-0 pt-0.5 text-right text-sm text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">{p.orden}</span>
            <div className="min-w-0 flex-1">
              {enEdicion ? (
                <div className="flex flex-col gap-3">
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className={campo} autoFocus />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" disabled={ocupado} onClick={() => correr({ accion: "editar", id: p.id, texto })} className={botonPrincipal}>
                      {ocupado ? "Guardando…" : "Guardar"}
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => setEditando(null)} className={botonChico}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`text-[16px] leading-relaxed ${esAdaptativa ? "italic text-[var(--texto-menor)]" : ""}`}>{p.texto}</p>
                  <p className="mt-0.5 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                    {p.capitulo}
                    {p.tipo === "familia" ? " · la sumó la familia" : ""}
                    {p.tipo === "sugerida" ? " · sugerida por el biógrafo" : ""}
                    {p.foto_id ? " · con foto" : ""}
                    {esAdaptativa ? " · la escribe el biógrafo" : ""}
                  </p>
                  {puedeEditar && !esAdaptativa ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <button type="button" className={botonChico} disabled={ocupado} onClick={() => { setEditando(p.id); setTexto(p.texto); setConfirmando(null); }}>Editar</button>
                      {confirmando === p.id ? (
                        <span className="flex items-center gap-3 text-sm">
                          <span className="text-[var(--texto-suave)]">¿Sacarla del guion?</span>
                          <button type="button" className={`${botonChico} text-red-700`} disabled={ocupado} onClick={() => correr({ accion: "saltar", id: p.id })}>Sí, sacarla</button>
                          <button type="button" className={botonChico} disabled={ocupado} onClick={() => setConfirmando(null)}>No</button>
                        </span>
                      ) : (
                        <button type="button" className={botonChico} disabled={ocupado || !puedeSaltar} title={puedeSaltar ? undefined : "Con menos de 15 no alcanza para un libro"} onClick={() => setConfirmando(p.id)}>Sacar</button>
                      )}
                      <span className="ml-auto flex gap-1">
                        <button type="button" aria-label="Subir" className={botonChico} disabled={ocupado || pos <= 0} onClick={() => mover(p.id, -1)}>↑</button>
                        <button type="button" aria-label="Bajar" className={botonChico} disabled={ocupado || pos >= editables.length - 1} onClick={() => mover(p.id, 1)}>↓</button>
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {i === futuras.length - 1 && error ? <Error_ mensaje={error} /> : null}
          </li>
        );
      })}
      {error ? <li className="pl-10"><Error_ mensaje={error} /></li> : null}
    </ol>
  );
}

// ── agregar una pregunta (dueña e invitados) ───────────────────────────

export function AgregarPregunta({
  narradorId, capitulos, lugarLibre, textoInicial = "", capituloInicial,
}: { narradorId: string; capitulos: string[]; lugarLibre: number; textoInicial?: string; capituloInicial?: string }) {
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
        <button type="button" className={botonPrincipal} disabled={sinLugar} onClick={() => { setAbierto(true); setListo(null); }}>
          + Agregar una pregunta
        </button>
        {listo ? <p className="text-sm text-[var(--texto-suave)]">{listo}</p> : null}
        {sinLugar ? <p className="text-sm text-[var(--texto-menor)]">El guion está completo. Para sumar una, sacá otra.</p> : null}
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
              El biógrafo le manda la foto por WhatsApp con tu pregunta. Lo que cuente entra al libro junto con la foto.
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

export function SubirFoto({ narradorId, capitulos, capituloInicial, children }: { narradorId: string; capitulos: string[]; capituloInicial?: string; children?: ReactNode }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [capitulo, setCapitulo] = useState(capituloInicial ?? capitulos[0] ?? "");
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
        <button type="button" className={botonSecundario} onClick={() => { setAbierto(true); setAviso(null); }}>
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
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Capítulo</span>
          <SelectorCapitulo capitulos={capitulos} valor={capitulo} onChange={setCapitulo} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Epígrafe (opcional)</span>
          <input value={epigrafe} onChange={(e) => setEpigrafe(e.target.value)} className={campo} placeholder="Mar del Plata, verano del 68" maxLength={300} />
        </label>
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} className="h-4 w-4" />
          Que abra el capítulo (la foto principal)
        </label>
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
