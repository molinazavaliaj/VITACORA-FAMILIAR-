"use client";

import { useMemo, useState } from "react";
import { ANGULOS, COMPANIAS, NOMBRE_ANGULO, NOMBRE_COMPANIA, NOMBRE_PROPOSITO, PROPOSITOS, ETAPAS_MAXIMO, type Etapa, type Viaje } from "@/lib/viaje";
import { NADA_ELEGIDO, NOMBRE_VIAJE, DETALLE_VIAJE, type Extra, type ProductosElegidos } from "@/lib/productos";
import { ContadorMarcos, TarjetaImpreso, formatearPrecio as formatear } from "../productos-ui";
import { HORAS_VIAJE as HORAS, ZONAS } from "@/lib/horario";

// La compra de la Vitácora de viaje, en tres pasos. Las etapas pueden ir sin
// fechas: el viajero no siempre las tiene (después se completan desde el
// panel y se abren ciudades nuevas). Un solo POST a /api/compra al pagar,
// con `productos.viaje` y `narrador.contexto.viaje`. Desde el 21/09 (2.10) el
// impreso y los marcos se suman en el paso de pagar, con las mismas piezas del
// checkout Familiar; el total lo recalcula el servidor.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa). En vos: el viajero se compra a sí mismo.

export type PreciosViaje = Record<"ES" | "AR", number | null>;
export type ExtrasViaje = Record<"ES" | "AR", Extra[]>;
type Region = "ES" | "AR";
type Paso = 1 | 2 | 3;

const PASOS: { n: Paso; nombre: string }[] = [
  { n: 1, nombre: "Vos" },
  { n: 2, nombre: "El viaje" },
  { n: 3, nombre: "Pagar" },
];


const campo = "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";
const chip = (activo: boolean) => `rounded-full border px-4 py-2 text-[14px] transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] ${activo ? "border-[#14140F] bg-[#14140F] text-white" : "border-[#D4D4CE] bg-white hover:border-[#83837A]"}`;

export function CheckoutViaje({ precios, extras, regionInicial = "AR" }: { precios: PreciosViaje; extras: ExtrasViaje; regionInicial?: Region }) {
  const [paso, setPaso] = useState<Paso>(1);
  const [region, setRegion] = useState<Region>(regionInicial); // 2.12: por el país del visitante
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [salida, setSalida] = useState("");
  const [vuelta, setVuelta] = useState("");
  const [etapas, setEtapas] = useState<Etapa[]>([{ nombre: "" }]);
  const [compania, setCompania] = useState<Viaje["compania"]>("solo");
  const [proposito, setProposito] = useState<Viaje["proposito"]>("recuerdo");
  const [angulos, setAngulos] = useState<string[]>([]);
  const [hora, setHora] = useState("21:30");
  const [zona, setZona] = useState<string>("Europe/Madrid");
  const [evitar, setEvitar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // El viaje siempre va; el impreso y los marcos se suman.
  const [productos, setProductos] = useState<ProductosElegidos>({ ...NADA_ELEGIDO, viaje: true });

  const precio = precios[region];
  const moneda = region === "ES" ? "EUR" : "ARS";
  const impresoBn = extras[region].find((e) => e.id === "impreso_bn");
  const impresoColor = extras[region].find((e) => e.id === "impreso_color");
  const marco = extras[region].find((e) => e.id === "marco");
  // Las líneas del resumen y el total, para mostrar: el servidor lo recalcula al cobrar.
  const lineas = useMemo(() => {
    const l: { nombre: string; importe: number }[] = [];
    if (precio !== null) l.push({ nombre: NOMBRE_VIAJE, importe: precio });
    const impreso = productos.impreso === "color" ? impresoColor : productos.impreso === "bn" ? impresoBn : undefined;
    if (impreso) l.push({ nombre: impreso.nombre, importe: impreso.precio });
    if (productos.marcos > 0 && marco) l.push({ nombre: `${marco.nombre} × ${productos.marcos}`, importe: marco.precio * productos.marcos });
    return l;
  }, [precio, productos, impresoBn, impresoColor, marco]);
  const total = lineas.reduce((s, l) => s + l.importe, 0);
  const dias = useMemo(() => {
    const a = Date.parse(`${salida}T00:00:00Z`), b = Date.parse(`${vuelta}T00:00:00Z`);
    return Number.isFinite(a) && Number.isFinite(b) && b >= a ? Math.round((b - a) / 86_400_000) + 1 : null;
  }, [salida, vuelta]);

  function avanzar(siguiente: Paso) {
    setError(null);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editarEtapa(i: number, cambios: Partial<Etapa>) {
    setEtapas((x) => x.map((e, j) => (j === i ? { ...e, ...cambios } : e)));
  }

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (precio === null) { setError("La Vitácora de viaje todavía no está disponible en tu región."); return; }
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreComprador: nombre.trim(),
          vinculoComprador: "yo mismo",
          region,
          email: email.trim(),
          narrador: {
            nombre: nombre.trim(),
            comoLeDicen: comoLeDicen.trim() || nombre.trim().split(" ")[0],
            telefonoWhatsapp: telefono.trim(),
            horaPreferida: hora,
            zonaHoraria: zona,
            contexto: {
              ritmo: "diario",
              evitar: evitar.trim(),
              viaje: { salida, vuelta, etapas: etapas.filter((e) => e.nombre.trim()), compania, proposito, angulos },
            },
          },
          productos: { ...productos, pdf: false, viaje: true },
        }),
      });
      const datos = (await respuesta.json()) as { urlPago?: string; error?: string };
      if (!respuesta.ok || !datos.urlPago) {
        setError(datos.error ?? "No pudimos iniciar el pago. Intentá de nuevo.");
        setEnviando(false);
        return;
      }
      window.location.assign(datos.urlPago);
    } catch {
      setError("No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
      <div>
        <ol className="flex gap-4 sm:gap-8">
          {PASOS.map((p) => (
            <li key={p.n} className="flex-1">
              <p className={`text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.24em] ${p.n === paso ? "text-[#14140F]" : "text-[#AEAEA6]"}`}>{p.n}. {p.nombre}</p>
              <div className={`mt-2 h-[3px] rounded-full ${p.n <= paso ? "bg-[#14140F]" : "bg-[#D4D4CE]"}`} />
            </li>
          ))}
        </ol>

        {/* ── 1 · Vos ── */}
        {paso === 1 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">Tu biógrafo de viaje.</h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Cada noche te escribe por WhatsApp, vos le contás el día con un audio y le mandás la foto. Al volver, tu viaje es un libro.
            </p>
            <div className="mt-8 flex gap-2">
              {(["AR", "ES"] as Region[]).map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)} className={chip(region === r)}>{r === "AR" ? "Argentina" : "España"}</button>
              ))}
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={etiqueta} htmlFor="nombre">Tu nombre</label>
                <input id="nombre" className={`${campo} mt-2`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" autoComplete="name" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="apodo">Cómo te dicen</label>
                <input id="apodo" className={`${campo} mt-2`} value={comoLeDicen} onChange={(e) => setComoLeDicen(e.target.value)} placeholder="Así te va a saludar" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="tel">Tu WhatsApp</label>
                <input id="tel" className={`${campo} mt-2`} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={region === "AR" ? "11 5555 1234" : "612 345 678"} inputMode="tel" autoComplete="tel" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="email">Tu correo</label>
                <input id="email" type="email" className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@ejemplo.com" autoComplete="email" />
              </div>
            </div>
            <Botones
              siguiente={() => {
                if (!nombre.trim()) return setError("Decinos tu nombre.");
                if (!telefono.trim()) return setError("Falta tu WhatsApp: ahí te escribe el biógrafo.");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Necesitamos un correo válido: con ese entrás a tu panel.");
                avanzar(2);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 2 · El viaje ── */}
        {paso === 2 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">El viaje.</h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Lo que sepas hoy. Las etapas que no tengan fecha se completan después desde tu panel, y si aparece una ciudad nueva, la agregás ahí.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={etiqueta} htmlFor="salida">Salís el</label>
                <input id="salida" type="date" className={`${campo} mt-2`} value={salida} onChange={(e) => setSalida(e.target.value)} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="vuelta">Volvés el</label>
                <input id="vuelta" type="date" className={`${campo} mt-2`} value={vuelta} min={salida || undefined} onChange={(e) => setVuelta(e.target.value)} />
                {dias ? <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-micro)]">{dias} {dias === 1 ? "día" : "días"} · una pregunta por noche</p> : null}
              </div>
            </div>

            <div className="mt-10">
              <p className={etiqueta}>Las etapas</p>
              <p className="mt-2 text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Ciudad o tramo, y las fechas si las tenés. Cada etapa es un capítulo del libro.</p>
              <ul className="mt-4 flex flex-col gap-3">
                {etapas.map((e, i) => (
                  <li key={i} className="grid gap-2 rounded-lg border border-[#EBEBE7] bg-white p-3 sm:grid-cols-[1fr_150px_150px_auto] sm:items-center">
                    <input aria-label={`Etapa ${i + 1}`} className={campo} value={e.nombre} onChange={(ev) => editarEtapa(i, { nombre: ev.target.value })} placeholder={i === 0 ? "Lisboa" : "Otra ciudad o tramo"} />
                    <input aria-label="Desde" type="date" className={campo} value={e.desde ?? ""} min={salida || undefined} max={vuelta || undefined} onChange={(ev) => editarEtapa(i, { desde: ev.target.value || undefined })} />
                    <input aria-label="Hasta" type="date" className={campo} value={e.hasta ?? ""} min={e.desde || salida || undefined} max={vuelta || undefined} onChange={(ev) => editarEtapa(i, { hasta: ev.target.value || undefined })} />
                    <button type="button" aria-label="Sacar etapa" onClick={() => setEtapas((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [{ nombre: "" }]))} className="h-10 w-10 rounded-full border border-[#D4D4CE] text-lg [touch-action:manipulation]">×</button>
                  </li>
                ))}
              </ul>
              <button type="button" disabled={etapas.length >= ETAPAS_MAXIMO} onClick={() => setEtapas((x) => [...x, { nombre: "" }])} className="mt-3 text-[15px] text-[#14140F] underline underline-offset-4 disabled:opacity-60 [font-family:var(--fuente-micro)]">+ Agregar etapa</button>
            </div>

            <div className="mt-10">
              <p className={etiqueta}>¿Con quién viajás?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COMPANIAS.map((c) => <button key={c} type="button" onClick={() => setCompania(c)} className={chip(compania === c)}>{NOMBRE_COMPANIA[c]}</button>)}
              </div>
            </div>

            <fieldset className="mt-10">
              <legend className={etiqueta}>¿Para qué es el libro?</legend>
              <div className="mt-3 flex flex-col gap-2">
                {PROPOSITOS.map((p) => (
                  <label key={p} className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 ${proposito === p ? "border-2 border-[#14140F]" : "border-[#D4D4CE]"}`}>
                    <input type="radio" name="proposito" checked={proposito === p} onChange={() => setProposito(p)} className="mt-1" />
                    <span>
                      <span className="block text-[17px] [font-family:var(--fuente-titulo)]">{NOMBRE_PROPOSITO[p].titulo}</span>
                      <span className="block text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{NOMBRE_PROPOSITO[p].detalle}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-10">
              <p className={etiqueta}>¿Qué querés que te pregunte siempre?</p>
              <p className="mt-2 text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Elegí dos o tres. El resto lo va rotando el biógrafo.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ANGULOS.map((a) => (
                  <button key={a} type="button" onClick={() => setAngulos((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))} className={chip(angulos.includes(a))}>{NOMBRE_ANGULO[a]}</button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={etiqueta} htmlFor="hora">¿A qué hora te escribe?</label>
                <select id="hora" className={`${campo} mt-2`} value={hora} onChange={(e) => setHora(e.target.value)}>
                  {HORAS.map((h) => <option key={h.valor} value={h.valor}>{h.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={etiqueta} htmlFor="zona">Hora de dónde</label>
                <select id="zona" className={`${campo} mt-2`} value={zona} onChange={(e) => setZona(e.target.value)}>
                  {ZONAS.map(([z, n]) => <option key={z} value={z}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-10">
              <label className={etiqueta} htmlFor="evitar">Temas que no se preguntan (opcional)</label>
              <textarea id="evitar" className={`${campo} mt-2`} rows={2} value={evitar} onChange={(e) => setEvitar(e.target.value)} maxLength={1000} placeholder="Por ejemplo: no preguntar por el trabajo." />
            </div>

            <Botones
              atras={() => avanzar(1)}
              siguiente={() => {
                if (!salida || !vuelta) return setError("Necesitamos la fecha de salida y la de vuelta.");
                if (vuelta < salida) return setError("La vuelta no puede ser antes de la salida.");
                avanzar(3);
              }}
              etiquetaSiguiente="Ir a pagar"
              error={error}
            />
          </section>
        )}

        {/* ── 3 · Pagar ── */}
        {paso === 3 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">Listo para salir.</h1>
            <div className="mt-8 rounded-2xl border-2 border-[#14140F] bg-white p-6">
              <p className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">en la nube · {dias ?? "—"} noches</p>
              <p className="mt-2 text-[24px] leading-tight [font-family:var(--fuente-titulo)] font-medium">{NOMBRE_VIAJE}</p>
              <p className="mt-2 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{DETALLE_VIAJE} Se lee y se escucha en la web, cuando quieras.</p>
              <p className="mt-4 text-[28px] tabular-nums [font-family:var(--fuente-titulo)]">{precio !== null ? formatear(precio, moneda, region) : "Próximamente en tu región"}</p>
            </div>

            {/* 2.10: lo que se suma. ⚠️ Textos a revisar por Naza. */}
            {impresoBn || impresoColor || marco ? (
              <div className="mt-8">
                <p className={etiqueta}>Si querés, sumale</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <TarjetaImpreso
                    productos={productos}
                    setProductos={setProductos}
                    impresoBn={impresoBn}
                    impresoColor={impresoColor}
                    moneda={moneda}
                    region={region}
                    detalle="Tu viaje en tapa dura, con un código en la contratapa que hace sonar tu voz. Lo único que sale de la nube."
                  />
                </div>
                <ContadorMarcos productos={productos} setProductos={setProductos} marco={marco} moneda={moneda} region={region} detalle="Un marco con tu foto del viaje y un chip: se acerca el teléfono y suena tu voz. Para regalar a quien te esperó." />
              </div>
            ) : null}
            <div className="mt-6 rounded-lg border border-[#EBEBE7] bg-white p-5 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              <p><strong className="font-normal text-[#14140F]">Qué pasa después de pagar:</strong> te llega un correo para entrar a tu panel, y el biógrafo te escribe por WhatsApp para presentarse. Respondés SÍ y arranca la primera noche. Si algo no te cierra antes de salir, nos escribís y te devolvemos el dinero.</p>
            </div>
            {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => avanzar(2)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button>
              <button type="submit" disabled={enviando || precio === null} className="inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]">
                {enviando ? "Un momento…" : precio !== null ? `Pagar ${formatear(total, moneda, region)}` : "No disponible"}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              Pago único y seguro con {region === "ES" ? "Stripe" : "Mercado Pago"}. Al pagar aceptás los{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">términos</a>.
            </p>
          </form>
        )}
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border border-[#EBEBEE] bg-white p-6">
          <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Tu compra</p>
          <div className="mt-5 flex flex-col gap-2 border-b border-[#EBEBE7] pb-3">
            {lineas.length === 0 ? (
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[15px] [font-family:var(--fuente-cuerpo)] font-light">{NOMBRE_VIAJE}</span>
                <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">—</span>
              </div>
            ) : null}
            {lineas.map((l, i) => (
              <div key={l.nombre} className="flex items-baseline justify-between gap-4">
                <span className="text-[15px] [font-family:var(--fuente-cuerpo)] font-light">{l.nombre}{i === 0 && dias ? ` · ${dias} noches` : ""}</span>
                <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">{formatear(l.importe, moneda, region)}</span>
              </div>
            ))}
            {lineas.length > 1 ? (
              <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-[#EBEBE7] pt-2">
                <span className="text-[15px] [font-family:var(--fuente-micro)] font-medium">Total</span>
                <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)] font-medium">{formatear(total, moneda, region)}</span>
              </div>
            ) : null}
          </div>
          <ul className="mt-6 flex flex-col gap-2 text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
            <li>✓ Una pregunta cada noche, por WhatsApp</li>
            <li>✓ Tus fotos, con su historia, guardadas por día</li>
            <li>✓ Cada etapa, un capítulo del libro</li>
            <li>✓ Lo leés y lo compartís desde la web</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Botones({ atras, siguiente, etiquetaSiguiente = "Continuar", error }: { atras?: () => void; siguiente: () => void; etiquetaSiguiente?: string; error: string | null }) {
  return (
    <>
      {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {atras ? <button type="button" onClick={atras} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button> : <span />}
        <button type="button" onClick={siguiente} className="inline-flex h-13 items-center justify-center rounded-full bg-[#14140F] px-8 text-base font-medium text-white transition-colors hover:bg-[#2B2B24] [font-family:var(--fuente-micro)]">{etiquetaSiguiente}</button>
      </div>
    </>
  );
}
