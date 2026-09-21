"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NADA_ELEGIDO, type Catalogo as CatalogoRegion, type ProductosElegidos } from "@/lib/productos";
import { ContadorMarcos, Producto, TarjetaImpreso, formatearPrecio as formatear } from "./productos-ui";
import { HORAS_FAMILIAR as HORAS } from "@/lib/horario";
import { EVITAR_MAXIMO, NOMBRE_RITMO, RITMOS, RITMO_DEFAULT, TAMANO_MAXIMO_BYTES, errorDeTipoDeFoto, type Ritmo } from "@/lib/guion";
import { medirImagen } from "@/lib/medir-imagen";

// El paso a paso de la compra. Estado en el cliente, un solo POST al final.
// Los precios llegan resueltos del servidor: acá solo se suman para mostrar
// el carrito; lo que se cobra lo recalcula /api/compra con los mismos datos.
//
// Paso 5 (17/09, decisión de Joaquín): antes de pagar se dejan los ajustes de
// la entrevista (ritmo, temas a evitar) y las fotos del álbum, para que el
// libro pueda terminarse sin entrar nunca al panel. Todo opcional. Las fotos
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
  { n: 5, nombre: "La entrevista" },
];

/** Una foto elegida en el paso 5, con su miniatura y si ya quedó subida (para no duplicarla al reintentar). */
type FotoElegida = { clave: string; archivo: File; url: string; subida: boolean };
const FOTOS_MAXIMO = 20;



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
  // El contexto mínimo del alta (21/09, Naza): el biógrafo arranca sabiendo la
  // edad, si está casado o viudo y si tiene hijos — así no pregunta por una boda
  // que no hubo. Todo opcional; lo que no se dice, no se manda.
  const [anioNacimiento, setAnioNacimiento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [hijos, setHijos] = useState<"" | "si" | "no">("");
  const [telefono, setTelefono] = useState("");
  const [hora, setHora] = useState("09:00");

  // Los tres productos: el PDF viene marcado; al menos uno tiene que quedar.
  const [productos, setProductos] = useState<ProductosElegidos>({ ...NADA_ELEGIDO, pdf: true });
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState<string | null>(null);

  // Paso 5: la entrevista y el álbum (todo opcional).
  const [ritmo, setRitmo] = useState<Ritmo>(RITMO_DEFAULT);
  const [evitar, setEvitar] = useState("");
  const [fotos, setFotos] = useState<FotoElegida[]>([]);
  const entradaFotos = useRef<HTMLInputElement>(null);
  // El resultado del POST a /api/compra, por si una foto falla y se reintenta:
  // el narrador ya existe, no hace falta crearlo de nuevo. Se olvida al volver atrás.
  const compraIniciada = useRef<{ urlPago: string; narradorId: string; tokenFotos: string } | null>(null);
  useEffect(() => () => { for (const f of fotos) URL.revokeObjectURL(f.url); }, [fotos]);

  const cat = catalogo[region];

  const impresoBn = cat.extras.find((e) => e.id === "impreso_bn");
  const impresoColor = cat.extras.find((e) => e.id === "impreso_color");
  const marco = cat.extras.find((e) => e.id === "marco");

  const carrito = useMemo(() => {
    const lineas: { nombre: string; cantidad: number; importe: number }[] = [];
    if (productos.pdf) lineas.push({ nombre: cat.pdf.nombre, cantidad: 1, importe: cat.pdf.precio });
    if (productos.impreso) {
      const e = productos.impreso === "color" ? impresoColor : impresoBn;
      if (e) lineas.push({ nombre: e.nombre, cantidad: 1, importe: e.precio });
    }
    if (productos.marcos > 0 && marco) {
      lineas.push({ nombre: marco.nombre, cantidad: productos.marcos, importe: marco.precio * productos.marcos });
    }
    return { lineas, total: lineas.reduce((s, l) => s + l.importe, 0) };
  }, [cat, productos, impresoBn, impresoColor, marco]);

  // Ricitos de oro: al menos uno de los dos. Los marcos solos no alcanzan.
  const hayPrincipal = productos.pdf || (productos.impreso !== null && (impresoBn || impresoColor));

  function avanzar(siguiente: Paso) {
    setError(null);
    if (siguiente < 5) compraIniciada.current = null; // si cambia algo, la compra se vuelve a crear
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validarNarrador(): string | null {
    if (paraQuien === "otro" && !nombreComprador.trim()) return "Dinos tu nombre: es lo que él va a leer cuando le escribamos.";
    if (paraQuien === "otro" && !vinculo.trim()) return "Cuéntanos qué eres de él o de ella (hija, nieto...).";
    if (!nombre.trim()) return paraQuien === "yo" ? "Dinos tu nombre." : "Falta el nombre del narrador.";
    if (!comoLeDicen.trim()) return "¿Cómo le dicen en casa? Es como lo vamos a saludar.";
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
    if (!hayPrincipal) {
      setError("Elegí al menos uno: el libro en PDF o el libro impreso.");
      return;
    }
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
                ritmo,
                evitar: evitar.trim(),
                ...(anioNacimiento.trim() ? { anioNacimiento: Number(anioNacimiento) } : {}),
                ...(estadoCivil ? { estadoCivil } : {}),
                // "no tiene hijos" = arbol.hijos 'no tuvo': el capítulo «Los hijos» se reemplaza sin preguntar.
                ...(hijos === "no" ? { arbol: { hijos: "no tuvo" } } : {}),
              },
            },
            productos,
          }),
        });
        const datos = (await respuesta.json()) as { urlPago?: string; narradorId?: string; tokenFotos?: string; error?: string };
        if (!respuesta.ok || !datos.urlPago || !datos.narradorId || !datos.tokenFotos) {
          setError(datos.error ?? "No pudimos iniciar el pago. Intenta de nuevo.");
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
          setError(`${e instanceof Error ? e.message : `No pudimos subir ${foto.archivo.name}.`} Sácala o intenta de nuevo.`);
          setEnviando(false);
          return;
        }
      }
      setProgreso(null);
      window.location.assign(urlPago);
    } catch {
      setProgreso(null);
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
                  <label className={etiqueta} htmlFor="hijos">{paraQuien === "yo" ? "¿Tienes hijos?" : "¿Tiene hijos?"}</label>
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
              Ahí te avisamos cuando {paraQuien === "yo" ? "haya páginas para leer" : "él acepte, cuando haya páginas para leer"}, y cuando el libro esté listo. Con ese mismo correo entras a tu panel.
            </p>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="email">Tu correo</label>
              <input id="email" type="email" className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="martina@ejemplo.com" autoComplete="email" spellCheck={false} required />
            </div>
            <Botones
              atras={() => avanzar(2)}
              siguiente={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
                  setError("Necesitamos un correo válido: ahí te avisamos de todo.");
                  return;
                }
                avanzar(4);
              }}
              etiquetaSiguiente="Elegir el libro"
              error={error}
            />
          </section>
        )}

        {/* ── Paso 4 · El libro: los tres productos, al menos uno ── */}
        {paso === 4 && (
          <section className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">
              ¿Cómo quieres {paraQuien === "yo" ? "tu libro" : `el libro de ${comoLeDicen || nombre || "su vida"}`}?
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Elige al menos uno. Los dos salen de la misma entrevista: 30 preguntas por WhatsApp, un audio por día.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Producto
                activa={productos.pdf}
                onClick={() => setProductos((x) => ({ ...x, pdf: !x.pdf }))}
                nota="en la nube"
                titulo={cat.pdf.nombre}
                detalle={cat.pdf.detalle}
                precio={formatear(cat.pdf.precio, cat.moneda, region)}
              />
              <TarjetaImpreso
                productos={productos}
                setProductos={setProductos}
                impresoBn={impresoBn}
                impresoColor={impresoColor}
                moneda={cat.moneda}
                region={region}
                detalle="Tapa dura, con un código en la contratapa que hace sonar su voz. Lo único que sale de la nube."
              />
            </div>

            <ContadorMarcos productos={productos} setProductos={setProductos} marco={marco} moneda={cat.moneda} region={region} />

            <Botones
              atras={() => avanzar(3)}
              siguiente={() => {
                if (!hayPrincipal) {
                  setError("Elige al menos uno: el libro en PDF o el libro impreso.");
                  return;
                }
                avanzar(5);
              }}
              etiquetaSiguiente="Continuar"
              error={error}
            />
          </section>
        )}

        {/* ── Paso 5 · La entrevista: ritmo, temas a evitar y el álbum. Todo opcional; acá se paga. ── */}
        {paso === 5 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">
              Cómo va a ser la entrevista.
            </h1>
            <p className="mt-3 text-[16px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Todo esto es opcional y se puede cambiar después desde tu panel. Si prefieres, baja y paga.
            </p>

            <fieldset className="mt-10">
              <legend className={etiqueta}>Ritmo</legend>
              <div className="mt-3 flex flex-col gap-2">
                {RITMOS.map((r) => (
                  <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 transition-colors ${ritmo === r ? "border-2 border-[#14140F]" : "border-[#D4D4CE] hover:border-[#83837A]"}`}>
                    <input type="radio" name="ritmo" value={r} checked={ritmo === r} onChange={() => setRitmo(r)} className="mt-1" />
                    <span>
                      <span className="block text-[17px] [font-family:var(--fuente-titulo)]">{NOMBRE_RITMO[r].titulo}</span>
                      <span className="block text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{NOMBRE_RITMO[r].detalle}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Además, al terminar cada respuesta el biógrafo le ofrece seguir con la siguiente. {paraQuien === "yo" ? "Tú también marcas tu ritmo." : "Él también marca su ritmo."}</p>
            </fieldset>

            <div className="mt-10">
              <label className={etiqueta} htmlFor="evitar">Temas que no se preguntan</label>
              <textarea id="evitar" className={`${campo} mt-2`} rows={3} value={evitar} onChange={(e) => setEvitar(e.target.value)} maxLength={EVITAR_MAXIMO} placeholder="Por ejemplo: no preguntar por su hermano Rubén. No hablar del accidente del 92." />
              <p className="mt-2 text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">El biógrafo lo tiene presente en todas sus preguntas.</p>
            </div>

            <div className="mt-10">
              <p className={etiqueta}>El álbum del libro</p>
              <p className="mt-2 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                Las fotos que quieras que estén en el libro: de la infancia, de la boda, de los hijos. Después, desde tu panel, las pones en su capítulo, en la tapa o en un marco. Cuantos más píxeles, mejor se imprimen.
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
                {paraQuien === "yo" ? "tu WhatsApp" : `${comoLeDicen || "él"} por WhatsApp`} contándole y pidiéndole permiso. No
                empieza nada hasta que diga que sí. Si no acepta, nos escribes y te devolvemos el dinero.
              </p>
            </div>

            {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" disabled={enviando} onClick={() => avanzar(4)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← Atrás</button>
              <button
                type="submit"
                disabled={enviando || !hayPrincipal}
                className="inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]"
              >
                {enviando ? (progreso ?? "Un momento…") : `Pagar ${formatear(carrito.total, cat.moneda, region)}`}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              Pago único y seguro con {region === "ES" ? "Stripe" : "Mercado Pago"}. Al pagar aceptas los{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">términos</a>
              {region === "ES"
                ? " y nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar los 14 días de desistimiento: si te arrepientes con la entrevista en marcha, se descuenta la parte ya hecha."
                : "."}
            </p>
          </form>
        )}
      </div>

      {/* ── El carrito ── */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border border-[#EBEBEE] bg-white p-6">
          <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Tu compra</p>
          <ul className="mt-5 divide-y divide-[#EBEBE7]">
            {carrito.lineas.length === 0 ? (
              <li className="py-3 text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Todavía no elegiste nada.</li>
            ) : null}
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
            <li>✓ Lo lees y lo escuchas en la web, cuando quieras</li>
            <li>✓ Si él no acepta, te devolvemos el dinero</li>
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
