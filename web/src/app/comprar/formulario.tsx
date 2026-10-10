"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { armarCompra, type Catalogo as CatalogoRegion, type Carrito } from "@/lib/productos";
import { BaseFija, Ticket, Upsells, formatearPrecio as formatear, listaDe } from "./productos-ui";
import { HORAS_FAMILIAR as HORAS } from "@/lib/horario";
import { TAMANO_MAXIMO_BYTES, errorDeTipoDeFoto } from "@/lib/guion";
import { esPalabraDeFamilia, MENSAJE_PALABRA_DE_FAMILIA, nombreDePila } from "@/lib/como-le-dicen";
import type { IdiomaRegalo } from "@/lib/regalo-textos";
import { GENEROS, type Genero } from "@/lib/regalo-reglas";
import { medirImagen } from "@/lib/medir-imagen";

// El paso a paso de la compra. Estado en el cliente, un solo POST al final.
// Los precios llegan resueltos del servidor: acá solo se suman para mostrar
// el carrito; lo que se cobra lo recalcula /api/compra con los mismos datos.
//
// Paso 5: las fotos del álbum, opcionales. Desde el 10/10 (textos web V3, Naza 06/10) ya no
// hay ritmo, temas a evitar, temas ni «algo que no puede faltar»: la entrevista V3 es un banco
// igual para todos y no los usa. Las fotos
// se suben DESPUÉS del POST a /api/compra (que crea el narrador) y ANTES de
// ir al proveedor de pago, con el token de una hora que devuelve ese POST.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa). Castellano neutro de "tú".

export type Catalogo = Record<"ES" | "AR", CatalogoRegion>;

type Region = "ES" | "AR";
type ParaQuien = "otro" | "yo";
type Paso = 1 | 2 | 3 | 4 | 5;

const PASOS: { n: Paso; nombre: string }[] = [
  { n: 1, nombre: "Para quién" },
  { n: 2, nombre: "El narrador" },
  { n: 3, nombre: "Tu correo" },
  { n: 4, nombre: "El libro" },
  { n: 5, nombre: "Las fotos" },
];

/** Una foto elegida en el paso 5, con su miniatura y si ya quedó subida (para no duplicarla al reintentar). */
type FotoElegida = { clave: string; archivo: File; url: string; subida: boolean };
const FOTOS_MAXIMO = 20;



const campo =
  "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";
const chip = (activo: boolean) => `rounded-full border px-4 py-2 text-[14px] transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] ${activo ? "border-[#14140F] bg-[#14140F] text-white" : "border-[#D4D4CE] bg-white hover:border-[#83837A]"}`;

export function Checkout({ catalogo, regionInicial = "AR", promo = null }: { catalogo: Catalogo; regionInicial?: Region; promo?: number | null }) {
  const [paso, setPaso] = useState<Paso>(1);
  const [paraQuien, setParaQuien] = useState<ParaQuien | null>(null);
  const [region] = useState<Region>(regionInicial); // 2.12: por el país del visitante (IP); sin selector

  const [nombreComprador, setNombreComprador] = useState("");
  const [vinculo, setVinculo] = useState("");
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  // El contexto mínimo del alta (21/09, Naza): el biógrafo arranca sabiendo la
  // edad, si está casado o viudo y si tiene hijos — así no pregunta por una boda
  // que no hubo. Todo opcional; lo que no se dice, no se manda.
  const [anioNacimiento, setAnioNacimiento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [hijos, setHijos] = useState<"" | "si" | "no">("");
  // 3t.22 (21/09): dónde vive (vocabulario y época para el biógrafo) y el trato
  // que eligió la familia. Sin elegir, lo decide el biógrafo con la ficha.
  const [dondeVive, setDondeVive] = useState("");
  // «¿Cómo le hablamos?» (V3): marcado de entrada según el país desde donde compra; se puede cambiar.
  const [idioma, setIdioma] = useState<IdiomaRegalo>(regionInicial === "ES" ? "es-ES" : "es-AR");
  // La entrevista V3 lo necesita para hablarle bien (sin él, el alta se frena). Los textos son los del regalo.
  const [genero, setGenero] = useState<Genero | null>(null);
  const [telefono, setTelefono] = useState("");
  const [hora, setHora] = useState("09:00");

  // El carrito arranca con el libro impreso puesto (Naza 06/10); quien quiera solo el PDF, lo saca. Donde el
  // impreso no se vende todavía (sin precio en esa región), arranca sin él: si no, el pago se rechazaría.
  const [carritoElegido, setCarrito] = useState<Carrito>({ base: "pdf", impresos: catalogo[regionInicial].impreso ? 1 : 0, marcos: 0 });
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState<string | null>(null);

  // Paso 5: el álbum (opcional).
  const [fotos, setFotos] = useState<FotoElegida[]>([]);
  const entradaFotos = useRef<HTMLInputElement>(null);
  // El resultado del POST a /api/compra, por si una foto falla y se reintenta:
  // el narrador ya existe, no hace falta crearlo de nuevo. Se olvida al volver atrás.
  const compraIniciada = useRef<{ urlPago: string; narradorId: string; tokenFotos: string } | null>(null);
  useEffect(() => () => { for (const f of fotos) URL.revokeObjectURL(f.url); }, [fotos]);

  const cat = catalogo[region];

  // El ticket en vivo, con la misma función que cobra el servidor.
  const carrito = useMemo(() => armarCompra(cat, region, carritoElegido), [cat, region, carritoElegido]);

  function avanzar(siguiente: Paso) {
    setError(null);
    if (siguiente < 5) compraIniciada.current = null; // si cambia algo, la compra se vuelve a crear
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validarNarrador(): string | null {
    if (paraQuien === "otro" && !nombreComprador.trim()) return "Decinos tu nombre. Es lo que va a leer cuando le escribamos.";
    if (paraQuien === "otro" && !vinculo.trim()) return "Contanos qué sos de esa persona (hija, nieto...).";
    if (!nombre.trim()) return paraQuien === "yo" ? "Decinos tu nombre." : "Falta el nombre del narrador.";
    if (!comoLeDicen.trim()) return "¿Cómo le escribimos? Poné su nombre o su apodo.";
    if (paraQuien === "otro" && esPalabraDeFamilia(comoLeDicen)) return MENSAJE_PALABRA_DE_FAMILIA;
    if (!genero) return paraQuien === "yo" ? "¿Sos hombre o mujer? Lo necesita el biógrafo para hablarte bien." : "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.";
    if (anioNacimiento.trim() && (Number(anioNacimiento) < 1900 || Number(anioNacimiento) > 2015)) return "El año de nacimiento no parece bien (entre 1900 y 2015).";
    if (!telefono.trim()) return "Falta el WhatsApp.";
    return null;
  }

  function elegirFotos(lista: FileList | null) {
    if (!lista) return;
    setError(null);
    const nuevas: FotoElegida[] = [];
    for (const archivo of Array.from(lista)) {
      const errorDeTipo = errorDeTipoDeFoto(archivo.type);
      if (errorDeTipo) { setError(errorDeTipo); continue; }
      if (archivo.size > TAMANO_MAXIMO_BYTES) { setError(`${archivo.name} pesa más de 25 MB.`); continue; }
      nuevas.push({ clave: `${archivo.name}-${archivo.size}-${archivo.lastModified}`, archivo, url: URL.createObjectURL(archivo), subida: false });
    }
    setFotos((x) => {
      const claves = new Set(x.map((f) => f.clave));
      return [...x, ...nuevas.filter((f) => !claves.has(f.clave))].slice(0, FOTOS_MAXIMO);
    });
    if (entradaFotos.current) entradaFotos.current.value = "";
  }

  async function subirFotoDelAlbum(narradorId: string, token: string, foto: FotoElegida) {
    const form = new FormData();
    form.set("archivo", foto.archivo);
    const medida = await medirImagen(foto.archivo);
    if (medida) { form.set("ancho", String(medida.ancho)); form.set("alto", String(medida.alto)); }
    const r = await fetch(`/api/fotos?narrador=${encodeURIComponent(narradorId)}&token=${encodeURIComponent(token)}`, { method: "POST", body: form });
    const json = (await r.json().catch(() => ({}))) as { error?: string; id?: string };
    if (!r.ok || !json.id) throw new Error(json.error ?? `No pudimos subir ${foto.archivo.name}.`);
  }

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (!compraIniciada.current) {
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
              contexto: {
                idioma,
                ...(genero ? { genero } : {}),
                ...(anioNacimiento.trim() ? { anioNacimiento: Number(anioNacimiento) } : {}),
                ...(estadoCivil ? { estadoCivil } : {}),
                // "no tiene hijos" = arbol.hijos 'no tuvo': el capítulo «Los hijos» se reemplaza sin preguntar.
                ...(hijos === "no" ? { arbol: { hijos: "no tuvo" } } : {}),
                ...(dondeVive.trim() ? { dondeVive: dondeVive.trim() } : {}),
              },
            },
            productos: { impresos: carritoElegido.impresos, marcos: carritoElegido.marcos },
          }),
        });
        const datos = (await respuesta.json()) as { urlPago?: string; narradorId?: string; tokenFotos?: string; error?: string };
        if (!respuesta.ok || !datos.urlPago || !datos.narradorId || !datos.tokenFotos) {
          setError(datos.error ?? "No pudimos iniciar el pago. Intentá de nuevo.");
          setEnviando(false);
          return;
        }
        compraIniciada.current = { urlPago: datos.urlPago, narradorId: datos.narradorId, tokenFotos: datos.tokenFotos };
      }
      const { urlPago, narradorId, tokenFotos } = compraIniciada.current;

      // Las fotos, una por una. Si una falla, se avisa y NO se va a pagar: la
      // familia la saca o reintenta (las ya subidas no se repiten).
      const pendientes = fotos.filter((f) => !f.subida);
      for (let i = 0; i < pendientes.length; i++) {
        const foto = pendientes[i];
        setProgreso(`Subiendo foto ${i + 1} de ${pendientes.length}…`);
        try {
          await subirFotoDelAlbum(narradorId, tokenFotos, foto);
          setFotos((x) => x.map((f) => (f.clave === foto.clave ? { ...f, subida: true } : f)));
        } catch (e) {
          setProgreso(null);
          setError(`${e instanceof Error ? e.message : `No pudimos subir ${foto.archivo.name}.`} Sacala o intentá de nuevo.`);
          setEnviando(false);
          return;
        }
      }
      setProgreso(null);
      window.location.assign(urlPago);
    } catch {
      setProgreso(null);
      setError("No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo.");
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
                  { v: "otro", t: "De un ser querido", d: "Mi papá, mi abuela, mi tío. Yo lo anoto y la historia la cuenta quien la vivió." },
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
                if (!paraQuien) return setError("Elegí una de las dos.");
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
              {paraQuien === "yo" ? "Contanos quién sos." : "Contanos quién va a contar su historia."}
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Lo justo para presentarnos bien. El resto lo va a contar en la entrevista.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              {/* 2.12 (21/09): la región la decide el país de quien compra (por IP); el selector se sacó.
                  Se muestra cuál es, chiquito, por si alguien mira desde otro país. */}
              <p className="text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                Precios en {region === "ES" ? "euros" : "pesos argentinos"}.
              </p>

              {paraQuien === "otro" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={etiqueta} htmlFor="nombreComprador">Tu nombre</label>
                    <input id="nombreComprador" className={`${campo} mt-2`} value={nombreComprador} onChange={(e) => setNombreComprador(e.target.value)} placeholder="Martina" autoComplete="given-name" />
                  </div>
                  <div>
                    <label className={etiqueta} htmlFor="vinculo">Tu vínculo</label>
                    <input id="vinculo" className={`${campo} mt-2`} value={vinculo} onChange={(e) => setVinculo(e.target.value)} placeholder="hija, nieto, sobrina..." />
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={etiqueta} htmlFor="nombre">{paraQuien === "yo" ? "Tu nombre completo" : "Su nombre completo"}</label>
                  <input id="nombre" className={`${campo} mt-2`} value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={() => { if (!comoLeDicen.trim()) setComoLeDicen(nombreDePila(nombre)); }} placeholder="Roberto Fernández" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Va en la portada del libro.</p>
                </div>
                <div>
                  <label className={etiqueta} htmlFor="comoLeDicen">{paraQuien === "yo" ? "Cómo te dicen" : "¿Cómo le escribimos?"}</label>
                  <input id="comoLeDicen" className={`${campo} mt-2`} value={comoLeDicen} onChange={(e) => setComoLeDicen(e.target.value)} placeholder="Roberto, Beto, Don Roberto" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                    {paraQuien === "yo" ? "Así lo vamos a saludar." : 'Así lo va a saludar el biógrafo por WhatsApp. Si tiene un apodo, ponelo. Nada de "papá" ni "abuela".'}
                  </p>
                </div>
              </div>

              <fieldset>
                <legend className={etiqueta}>{paraQuien === "yo" ? "¿Sos hombre o mujer? Lo necesita el biógrafo para hablarte bien." : "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien."}</legend>
                <div className="mt-2 flex flex-wrap gap-2" role="group">
                  {GENEROS.map((g) => (
                    <button key={g} type="button" aria-pressed={genero === g} onClick={() => setGenero(g)} className={chip(genero === g)}>
                      {g === "varon" ? "Hombre" : g === "mujer" ? "Mujer" : "Prefiero no decirlo"}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={etiqueta} htmlFor="telefono">{paraQuien === "yo" ? "Tu WhatsApp" : "Su WhatsApp"}</label>
                  <input id="telefono" className={`${campo} mt-2`} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={region === "AR" ? "11 5555 1234" : "612 345 678"} inputMode="tel" autoComplete="off" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                    {paraQuien === "yo" ? "Ahí te van a llegar las preguntas." : "Su número, no el tuyo. Ahí le van a llegar las preguntas."}
                  </p>
                </div>
                <div>
                  <label className={etiqueta} htmlFor="hora">A qué hora le escribimos</label>
                  <select id="hora" className={`${campo} mt-2`} value={hora} onChange={(e) => setHora(e.target.value)}>
                    {HORAS.map((h) => <option key={h.valor} value={h.valor}>{h.nombre}</option>)}
                  </select>
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">A esa hora le llega el primer mensaje. Después, la siguiente le llega cuando termina de responder la anterior.</p>
                </div>
              </div>

              {/* El contexto mínimo (21/09): opcional, pero cambia las preguntas desde el día 1. */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label className={etiqueta} htmlFor="anioNacimiento">Año de nacimiento</label>
                  <input id="anioNacimiento" className={`${campo} mt-2`} value={anioNacimiento} onChange={(e) => setAnioNacimiento(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1943" inputMode="numeric" />
                </div>
                <div>
                  <label className={etiqueta} htmlFor="estadoCivil">Estado civil</label>
                  <select id="estadoCivil" className={`${campo} mt-2`} value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)}>
                    <option value="">Prefiero no decir</option>
                    <option value="casado">Casado/a</option>
                    <option value="en_pareja">En pareja</option>
                    <option value="viudo">Viudo/a</option>
                    <option value="separado">Separado/a o divorciado/a</option>
                    <option value="soltero">Soltero/a</option>
                  </select>
                </div>
                <div>
                  <label className={etiqueta} htmlFor="hijos">{paraQuien === "yo" ? "¿Tenés hijos?" : "¿Tiene hijos?"}</label>
                  <select id="hijos" className={`${campo} mt-2`} value={hijos} onChange={(e) => setHijos(e.target.value as "" | "si" | "no")}>
                    <option value="">Prefiero no decir</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <p className="-mt-3 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
                Opcional. Con esto el biógrafo no pregunta por una boda que no hubo ni por hijos que no tiene, y sabe de qué época hablan.
              </p>

              {/* 3t.22: dónde vive y el trato. ⚠️ Textos a revisar por Naza. */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={etiqueta} htmlFor="dondeVive">{paraQuien === "yo" ? "¿Dónde vivís?" : "¿Dónde vive?"}</label>
                  <input id="dondeVive" className={`${campo} mt-2`} value={dondeVive} onChange={(e) => setDondeVive(e.target.value.slice(0, 120))} placeholder="Rosario, Argentina" autoComplete="off" />
                  <p className="mt-2 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Ciudad y país. Ayuda a entender su forma de hablar.</p>
                </div>
                <div>
                  <p className={etiqueta}>{paraQuien === "yo" ? "¿Cómo te hablamos?" : "¿Cómo le hablamos?"}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Idioma y trato">
                    {([["es-AR", "De vos"], ["es-ES", "De tú"], ["ca", "En catalán"]] as [IdiomaRegalo, string][]).map(([v, t]) => (
                      <button key={v} type="button" aria-pressed={idioma === v} onClick={() => setIdioma(v)} className={chip(idioma === v)}>{t}</button>
                    ))}
                  </div>
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

        {/* ── Paso 3 · Tu correo ── */}
        {paso === 3 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Tu correo.
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Ahí te avisamos {paraQuien === "yo" ? "cuando el libro esté listo" : "cuando acepte y cuando el libro esté listo"}. Con ese mismo correo entrás a tu panel.
            </p>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="email">Tu correo</label>
              <input id="email" type="email" className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="martina@ejemplo.com" autoComplete="email" spellCheck={false} required />
            </div>
            <Botones
              atras={() => avanzar(2)}
              siguiente={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
                  setError("Necesitamos un correo válido. Ahí te avisamos de todo.");
                  return;
                }
                avanzar(4);
              }}
              etiquetaSiguiente="Elegir el libro"
              error={error}
            />
          </section>
        )}

        {/* ── Paso 4 · El libro: la base incluida, y lo que se suma (21/09) ── */}
        {paso === 4 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">
              {paraQuien === "yo" ? "Tu libro, y lo que quieras sumarle." : `El libro de ${comoLeDicen || nombre || "su vida"}, y lo que quieras sumarle.`}
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              {carritoElegido.impresos > 0
                ? "Este es el regalo completo: el libro impreso, el PDF y «Su voz». Abajo podés sumarle los marcos."
                : "El libro en PDF con «Su voz» va siempre. Es donde ocurre la magia."}
            </p>

            <div className="mt-8">
              <BaseFija
                nota="en la nube"
                titulo={cat.base.nombre}
                detalle={cat.base.detalle}
                precio={formatear(cat.base.precio, cat.moneda, region)}
                lista={promo ? listaDe(cat.base.precio, cat.moneda, region, promo) : null}
                incluye={["La entrevista entera por WhatsApp, con audios, a su ritmo", "El libro para leer en la web, con sus fotos", "«Su voz»: sus mejores frases, en su voz real"]}
              />
            </div>

            <div className="mt-4">
              <Upsells cat={cat} region={region} carrito={carritoElegido} setCarrito={setCarrito} propia={paraQuien === "yo"} trato="vos" />
            </div>

            <Botones atras={() => avanzar(3)} siguiente={() => avanzar(5)} etiquetaSiguiente="Continuar" error={error} />
          </section>
        )}

        {/* ── Paso 5 · Las fotos del álbum. Opcional; acá se paga. ── */}
        {paso === 5 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">
              Sus fotos.
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Si tenés fotos suyas, subilas acá. También podés hacerlo después, desde tu panel.
            </p>

            <div className="mt-10">
              <p className={etiqueta}>El álbum del libro</p>
              <p className="mt-2 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                Las fotos que quieras que estén en su libro, de cualquier momento de su vida. Después, desde tu panel, elegís cuál va en la tapa y cuáles en los marcos. Cuantos más píxeles, mejor se imprimen.
              </p>
              <input ref={entradaFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => elegirFotos(e.target.files)} />
              {fotos.length > 0 && (
                <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {fotos.map((f) => (
                    <li key={f.clave} className="relative aspect-square overflow-hidden rounded-lg border border-[#D4D4CE] bg-[#EBEBE7]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local, no pasa por next/image */}
                      <img src={f.url} alt="" className="h-full w-full object-cover" />
                      {f.subida ? (
                        <span className="absolute bottom-1 left-1 rounded-full bg-[#14140F] px-2 py-0.5 text-[10px] uppercase text-white [font-family:var(--fuente-micro)] [letter-spacing:0.12em]">Subida</span>
                      ) : (
                        <button type="button" aria-label={`Sacar ${f.archivo.name}`} disabled={enviando} onClick={() => setFotos((x) => x.filter((g) => g.clave !== f.clave))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#14140F] shadow [touch-action:manipulation]">×</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" disabled={enviando || fotos.length >= FOTOS_MAXIMO} onClick={() => entradaFotos.current?.click()} className="mt-4 text-[15px] text-[#14140F] underline underline-offset-4 disabled:opacity-60 [font-family:var(--fuente-micro)]">
                {fotos.length === 0 ? "+ Agregar fotos" : `+ Agregar más (${fotos.length} de ${FOTOS_MAXIMO})`}
              </button>
            </div>

            <div className="mt-10 rounded-lg border border-[#EBEBE7] bg-white p-5 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              <p>
                <strong className="font-normal text-[#14140F]">Qué pasa después de pagar:</strong> le escribimos a{" "}
                {paraQuien === "yo" ? "tu WhatsApp" : `${comoLeDicen || "esa persona"} por WhatsApp`} contándole y pidiéndole permiso.
              </p>
            </div>

            {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" disabled={enviando} onClick={() => avanzar(4)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]"
              >
                {enviando ? (progreso ?? "Un momento…") : `Pagar ${formatear(carrito.total, cat.moneda, region)}`}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              Pago único y seguro con {region === "ES" ? "Stripe" : "Mercado Pago"}. Al pagar aceptás los{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">términos</a>
              {region === "ES"
                ? " y nos pedís que la entrevista empiece en cuanto el narrador acepte, sin esperar los 14 días de desistimiento. Si te arrepentís con la entrevista en marcha, se descuenta la parte ya hecha."
                : "."}
            </p>
          </form>
        )}
      </div>

      {/* ── El carrito ── */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border border-[#EBEBEE] bg-white p-6">
          <Ticket compra={carrito} region={region} />
          <ul className="mt-6 flex flex-col gap-2 text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
            <li>✓ Pago único, sin suscripción</li>
            <li>✓ La entrevista por WhatsApp, a su ritmo</li>
            <li>✓ Lo leés y lo escuchás en la web, cuando quieras</li>
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
