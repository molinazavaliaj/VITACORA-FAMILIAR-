"use client";

import { useMemo, useState } from "react";
import type { Extra, ExtrasElegidos } from "@/lib/productos";

// El paso a paso de la compra. Estado en el cliente, un solo POST al final.
// Los precios llegan resueltos del servidor: acá solo se suman para mostrar
// el carrito; lo que se cobra lo recalcula /api/compra con los mismos datos.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa). Castellano neutro de "tú".

export type Catalogo = Record<
  "ES" | "AR",
  { moneda: "EUR" | "ARS"; base: { nombre: string; precio: number }; extras: Extra[] }
>;

type Region = "ES" | "AR";
type ParaQuien = "otro" | "yo";
type Paso = 1 | 2 | 3 | 4;

const PASOS: { n: Paso; nombre: string }[] = [
  { n: 1, nombre: "Para quién" },
  { n: 2, nombre: "El narrador" },
  { n: 3, nombre: "Extras" },
  { n: 4, nombre: "Pago" },
];

const HORAS = [
  { valor: "09:00", nombre: "A la mañana (9:00)" },
  { valor: "11:00", nombre: "Media mañana (11:00)" },
  { valor: "16:00", nombre: "A la tarde (16:00)" },
  { valor: "19:00", nombre: "Al final del día (19:00)" },
];

function formatear(monto: number, moneda: "EUR" | "ARS", region: Region) {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

const campo =
  "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";

export function Checkout({ catalogo }: { catalogo: Catalogo }) {
  const [paso, setPaso] = useState<Paso>(1);
  const [paraQuien, setParaQuien] = useState<ParaQuien | null>(null);
  const [region, setRegion] = useState<Region>("AR");

  const [nombreComprador, setNombreComprador] = useState("");
  const [vinculo, setVinculo] = useState("");
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  const [telefono, setTelefono] = useState("");
  const [hora, setHora] = useState("09:00");

  const [extras, setExtras] = useState<ExtrasElegidos>({ impreso: null, marcos: 0 });
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cat = catalogo[region];

  const carrito = useMemo(() => {
    const lineas: { nombre: string; cantidad: number; importe: number }[] = [
      { nombre: cat.base.nombre, cantidad: 1, importe: cat.base.precio },
    ];
    if (extras.impreso) {
      const id = extras.impreso === "color" ? "impreso_color" : "impreso_bn";
      const e = cat.extras.find((x) => x.id === id);
      if (e) lineas.push({ nombre: e.nombre, cantidad: 1, importe: e.precio });
    }
    if (extras.marcos > 0) {
      const e = cat.extras.find((x) => x.id === "marco");
      if (e) lineas.push({ nombre: e.nombre, cantidad: extras.marcos, importe: e.precio * extras.marcos });
    }
    return { lineas, total: lineas.reduce((s, l) => s + l.importe, 0) };
  }, [cat, extras]);

  const impresoBn = cat.extras.find((e) => e.id === "impreso_bn");
  const impresoColor = cat.extras.find((e) => e.id === "impreso_color");
  const marco = cat.extras.find((e) => e.id === "marco");

  function avanzar(siguiente: Paso) {
    setError(null);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validarNarrador(): string | null {
    if (paraQuien === "otro" && !nombreComprador.trim()) return "Dinos tu nombre: es lo que él va a leer cuando le escribamos.";
    if (paraQuien === "otro" && !vinculo.trim()) return "Cuéntanos qué eres de él o de ella (hija, nieto...).";
    if (!nombre.trim()) return paraQuien === "yo" ? "Dinos tu nombre." : "Falta el nombre del narrador.";
    if (!comoLeDicen.trim()) return "¿Cómo le dicen en casa? Es como lo vamos a saludar.";
    if (!telefono.trim()) return "Falta el WhatsApp.";
    return null;
  }

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Necesitamos un correo válido: ahí te avisamos de todo.");
      return;
    }
    setEnviando(true);
    try {
      const esYo = paraQuien === "yo";
      const respuesta = await fetch("/api/compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreComprador: esYo ? nombre.trim() : nombreComprador.trim(),
          vinculoComprador: esYo ? "yo mismo" : vinculo.trim(),
          region,
          email: email.trim(),
          narrador: {
            nombre: nombre.trim(),
            comoLeDicen: comoLeDicen.trim(),
            telefonoWhatsapp: telefono.trim(),
            horaPreferida: hora,
          },
          extras,
        }),
      });
      const datos = (await respuesta.json()) as { urlPago?: string; error?: string };
      if (!respuesta.ok || !datos.urlPago) {
        setError(datos.error ?? "No pudimos iniciar el pago. Intenta de nuevo.");
        setEnviando(false);
        return;
      }
      window.location.assign(datos.urlPago);
    } catch {
      setError("No pudimos iniciar el pago. Revisa tu conexión e intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
      <div>
        {/* Progreso */}
        <ol className="flex gap-4 sm:gap-8">
          {PASOS.map((p) => (
            <li key={p.n} className="flex-1">
              <p className={`text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.24em] ${p.n === paso ? "text-[#14140F]" : "text-[#AEAEA6]"}`}>
                {p.n}. {p.nombre}
              </p>
              <div className={`mt-2 h-[3px] rounded-full ${p.n <= paso ? "bg-[#14140F]" : "bg-[#D4D4CE]"}`} />
            </li>
          ))}
        </ol>

        {/* ── Paso 1 · Para quién ── */}
        {paso === 1 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Primero: ¿de quién es la historia?
            </h1>
            <div className="mt-8 flex flex-col gap-4">
              {(
                [
                  { v: "otro", t: "De un ser querido", d: "Mi papá, mi abuela, mi tío. Yo lo anoto y él cuenta." },
                  { v: "yo", t: "La mía", d: "Quiero dejar contado de dónde vengo. Las preguntas me llegan a mí." },
                ] as { v: ParaQuien; t: string; d: string }[]
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setParaQuien(o.v)}
                  className={`flex items-start gap-4 rounded-lg border bg-white p-5 text-left transition-colors ${paraQuien === o.v ? "border-[#14140F]" : "border-[#D4D4CE] hover:border-[#83837A]"}`}
                >
                  <span className={`mt-1 inline-block h-4 w-4 shrink-0 rounded-full border ${paraQuien === o.v ? "border-[#14140F] bg-[#14140F] shadow-[inset_0_0_0_3px_#fff]" : "border-[#AEAEA6]"}`} />
                  <span>
                    <span className="block text-[17px] [font-family:var(--fuente-titulo)] font-medium">{o.t}</span>
                    <span className="mt-1 block text-[15px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{o.d}</span>
                  </span>
                </button>
              ))}
            </div>
            <Botones
              siguiente={() => {
                if (!paraQuien) return setError("Elige una de las dos.");
                avanzar(2);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── Paso 2 · El narrador ── */}
        {paso === 2 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              {paraQuien === "yo" ? "Cuéntanos quién eres." : "Cuéntanos de él, o de ella."}
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Lo justo para presentarnos bien. El resto lo cuenta él.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              <div>
                <label className={etiqueta}>País</label>
                <div className="mt-2 flex gap-3">
                  {(["AR", "ES"] as Region[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegion(r)}
                      className={`rounded-full border px-5 py-2 text-[15px] [font-family:var(--fuente-micro)] ${region === r ? "border-[#14140F] bg-[#14140F] text-white" : "border-[#D4D4CE] bg-white text-[#45453C]"}`}
                    >
                      {r === "AR" ? "Argentina" : "España"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                  Define la moneda y la hora de las preguntas.
                </p>
              </div>

              {paraQuien === "otro" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={etiqueta} htmlFor="nombreComprador">Tu nombre</label>
                    <input id="nombreComprador" className={`${campo} mt-2`} value={nombreComprador} onChange={(e) => setNombreComprador(e.target.value)} placeholder="Martina" autoComplete="given-name" />
                  </div>
                  <div>
                    <label className={etiqueta} htmlFor="vinculo">Qué eres de él / ella</label>
                    <input id="vinculo" className={`${campo} mt-2`} value={vinculo} onChange={(e) => setVinculo(e.target.value)} placeholder="hija, nieto, sobrina..." />
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={etiqueta} htmlFor="nombre">{paraQuien === "yo" ? "Tu nombre completo" : "Su nombre completo"}</label>
                  <input id="nombre" className={`${campo} mt-2`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Roberto Fernández" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Va en la portada del libro.</p>
                </div>
                <div>
                  <label className={etiqueta} htmlFor="comoLeDicen">{paraQuien === "yo" ? "Cómo te dicen" : "Cómo le dicen en casa"}</label>
                  <input id="comoLeDicen" className={`${campo} mt-2`} value={comoLeDicen} onChange={(e) => setComoLeDicen(e.target.value)} placeholder="Don Roberto, el Abuelo, Papá..." />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Así lo vamos a saludar.</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={etiqueta} htmlFor="telefono">{paraQuien === "yo" ? "Tu WhatsApp" : "Su WhatsApp"}</label>
                  <input id="telefono" className={`${campo} mt-2`} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={region === "AR" ? "11 5555 1234" : "612 345 678"} inputMode="tel" autoComplete="off" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                    {paraQuien === "yo" ? "Ahí te van a llegar las preguntas." : "El número de él, no el tuyo: ahí le van a llegar las preguntas."}
                  </p>
                </div>
                <div>
                  <label className={etiqueta} htmlFor="hora">A qué hora prefiere</label>
                  <select id="hora" className={`${campo} mt-2`} value={hora} onChange={(e) => setHora(e.target.value)}>
                    {HORAS.map((h) => <option key={h.valor} value={h.valor}>{h.nombre}</option>)}
                  </select>
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Una pregunta por día, siempre a esa hora.</p>
                </div>
              </div>
            </div>

            <Botones
              atras={() => avanzar(1)}
              siguiente={() => {
                const e = validarNarrador();
                if (e) return setError(e);
                avanzar(3);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── Paso 3 · Extras ── */}
        {paso === 3 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              ¿Quieres algo más que el libro?
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              El libro en PDF y el audiolibro con su voz ya están incluidos. Esto es aparte, y se puede sumar después también.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {impresoBn && (
                <Opcion
                  activa={extras.impreso === "bn"}
                  onClick={() => setExtras((x) => ({ ...x, impreso: x.impreso === "bn" ? null : "bn" }))}
                  titulo={impresoBn.nombre}
                  detalle={impresoBn.detalle}
                  precio={formatear(impresoBn.precio, cat.moneda, region)}
                />
              )}
              {impresoColor && (
                <Opcion
                  activa={extras.impreso === "color"}
                  onClick={() => setExtras((x) => ({ ...x, impreso: x.impreso === "color" ? null : "color" }))}
                  titulo={impresoColor.nombre}
                  detalle={impresoColor.detalle}
                  precio={formatear(impresoColor.precio, cat.moneda, region)}
                />
              )}
              {marco && (
                <div className={`rounded-lg border bg-white p-5 ${extras.marcos > 0 ? "border-[#14140F]" : "border-[#D4D4CE]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[17px] [font-family:var(--fuente-titulo)] font-medium">{marco.nombre}</p>
                      <p className="mt-1 text-[15px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{marco.detalle}</p>
                    </div>
                    <p className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">{formatear(marco.precio, cat.moneda, region)} c/u</p>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button type="button" aria-label="Un marco menos" onClick={() => setExtras((x) => ({ ...x, marcos: Math.max(0, x.marcos - 1) }))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg">−</button>
                    <span className="w-6 text-center text-[16px] [font-family:var(--fuente-micro)]">{extras.marcos}</span>
                    <button type="button" aria-label="Un marco más" onClick={() => setExtras((x) => ({ ...x, marcos: Math.min(20, x.marcos + 1) }))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg">+</button>
                  </div>
                </div>
              )}
              {!impresoBn && !impresoColor && !marco && (
                <p className="rounded-lg border border-dashed border-[#AEAEA6] bg-white p-5 text-[15px] text-[#5F5F55] [font-family:var(--fuente-cuerpo)] font-light">
                  Por ahora, el libro y el audiolibro. El libro impreso y los marcos con su voz se van a poder sumar desde tu panel cuando estén listos.
                </p>
              )}
            </div>

            <Botones atras={() => avanzar(2)} siguiente={() => avanzar(4)} etiquetaSiguiente="Ir al pago" error={error} />
          </section>
        )}

        {/* ── Paso 4 · Pago ── */}
        {paso === 4 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Último paso: tu correo.
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Ahí te avisamos cuando él acepte, cuando haya páginas para leer, y cuando el libro esté listo. Con ese mismo correo entras a tu panel.
            </p>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="email">Tu correo</label>
              <input id="email" type="email" className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="martina@ejemplo.com" autoComplete="email" required />
            </div>

            <div className="mt-8 rounded-lg border border-[#EBEBE7] bg-white p-5 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              <p>
                <strong className="font-normal text-[#14140F]">Qué pasa después de pagar:</strong> le escribimos a{" "}
                {paraQuien === "yo" ? "tu WhatsApp" : `${comoLeDicen || "él"} por WhatsApp`} contándole y pidiéndole permiso. No
                empieza nada hasta que diga que sí. Si no acepta, nos escribes y te devolvemos el dinero.
              </p>
            </div>

            {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]">{error}</p>}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => avanzar(3)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)]"
              >
                {enviando ? "Un momento…" : `Pagar ${formatear(carrito.total, cat.moneda, region)}`}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              Pago seguro con {region === "ES" ? "Stripe" : "Mercado Pago"}. Al pagar aceptas los{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">términos</a>.
            </p>
          </form>
        )}
      </div>

      {/* ── El carrito ── */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border border-[#EBEBEE] bg-white p-6">
          <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Tu compra</p>
          <ul className="mt-5 divide-y divide-[#EBEBE7]">
            {carrito.lineas.map((l) => (
              <li key={l.nombre} className="flex items-baseline justify-between gap-4 py-3">
                <span className="text-[15px] [font-family:var(--fuente-cuerpo)] font-light">
                  {l.nombre}{l.cantidad > 1 ? ` × ${l.cantidad}` : ""}
                </span>
                <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">{formatear(l.importe, cat.moneda, region)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-[#14140F] pt-4">
            <span className="text-[15px] [font-family:var(--fuente-micro)]">Total</span>
            <span className="text-2xl [font-family:var(--fuente-titulo)] font-medium">{formatear(carrito.total, cat.moneda, region)}</span>
          </div>
          <ul className="mt-6 flex flex-col gap-2 text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
            <li>✓ Pago único, sin suscripción</li>
            <li>✓ 30 preguntas, una por día, por WhatsApp</li>
            <li>✓ El libro en PDF y el audiolibro con su voz</li>
            <li>✓ Si él no acepta, te devolvemos el dinero</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Opcion({ activa, onClick, titulo, detalle, precio }: { activa: boolean; onClick: () => void; titulo: string; detalle: string; precio: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-start justify-between gap-4 rounded-lg border bg-white p-5 text-left transition-colors ${activa ? "border-[#14140F]" : "border-[#D4D4CE] hover:border-[#83837A]"}`}>
      <span className="flex items-start gap-4">
        <span className={`mt-1 inline-block h-4 w-4 shrink-0 rounded border ${activa ? "border-[#14140F] bg-[#14140F]" : "border-[#AEAEA6]"}`} />
        <span>
          <span className="block text-[17px] [font-family:var(--fuente-titulo)] font-medium">{titulo}</span>
          <span className="mt-1 block text-[15px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{detalle}</span>
        </span>
      </span>
      <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">{precio}</span>
    </button>
  );
}

function Botones({ atras, siguiente, etiquetaSiguiente = "Continuar", error }: { atras?: () => void; siguiente: () => void; etiquetaSiguiente?: string; error: string | null }) {
  return (
    <>
      {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {atras ? (
          <button type="button" onClick={atras} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button>
        ) : <span />}
        <button type="button" onClick={siguiente} className="inline-flex h-13 items-center justify-center rounded-full bg-[#14140F] px-8 text-base font-medium text-white transition-colors hover:bg-[#2B2B24] [font-family:var(--fuente-micro)]">
          {etiquetaSiguiente}
        </button>
      </div>
    </>
  );
}
