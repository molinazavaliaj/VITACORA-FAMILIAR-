"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent as EventoPuntero } from "react";
import { createPortal } from "react-dom";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_CUPON } from "../_textos/cupon";
import "./rasca.css";

// El rasca y gana (20/10, respuesta-19-10.md §1.3 y §1.4). Una tarjeta en la
// esquina, no un modal: no bloquea el scroll ni el botón de atrás, aparece a
// los pocos segundos y no al cargar, y si se cierra (la X o «No, gracias») no
// vuelve en esa visita. Si ya pidió el cupón en este navegador, no vuelve más.
//
// El premio es el mismo para todos: el rasca es solo visual (no hay azar, no
// es juego) y lo dice antes de rascar, con las condiciones que cambian la
// decisión (vigencia, solo digital, un uso, no acumulable). Las dos casillas
// van sin marcar y separadas; la segunda es opcional y el cupón llega igual.
// «Recibir mi cupón» y «No, gracias» tienen el mismo tamaño, color y peso.
//
// Solo se pinta con RASCA_Y_GANA=1 (lo decide el servidor, Pie).

const ESPERA_MS = 8000;
const CLAVE_CERRADO = "cupon-cerrado"; // sessionStorage: esta visita
const CLAVE_PEDIDO = "cupon-pedido"; // localStorage: ya lo pidió en este navegador
/** Cuánto hay que rascar para que se descubra solo. */
const RASCADO_SUFICIENTE = 0.45;

const leer = (almacen: () => Storage, clave: string) => {
  try {
    return almacen().getItem(clave);
  } catch {
    return null;
  }
};
const guardar = (almacen: () => Storage, clave: string) => {
  try {
    almacen().setItem(clave, "1");
  } catch {
    // Sin almacenamiento (ventana privada): vuelve a aparecer en la próxima visita, nada más.
  }
};

type Etapa = "rascar" | "pedir" | "enviado";

export function RascaYGana({ idioma, quien, correo }: { idioma: IdiomaWeb; quien: string; correo: string }) {
  const T = TEXTOS_CUPON[idioma].popup;
  const [visible, setVisible] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("rascar");
  const [email, setEmail] = useState("");
  const [recibir, setRecibir] = useState(false);
  const [recordatorios, setRecordatorios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const rascando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const id = useId();

  useEffect(() => {
    if (leer(() => window.localStorage, CLAVE_PEDIDO) || leer(() => window.sessionStorage, CLAVE_CERRADO)) return;
    const reloj = window.setTimeout(() => setVisible(true), ESPERA_MS);
    return () => window.clearTimeout(reloj);
  }, []);

  // La capa para rascar: un gris dorado sobre el premio.
  useEffect(() => {
    if (!visible || etapa !== "rascar") return;
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { width, height } = c.getBoundingClientRect();
    const escala = window.devicePixelRatio || 1;
    c.width = Math.round(width * escala);
    c.height = Math.round(height * escala);
    ctx.scale(escala, escala);
    ctx.fillStyle = "#a8936a";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 36;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [visible, etapa]);

  function cerrar() {
    guardar(() => window.sessionStorage, CLAVE_CERRADO);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [visible]);

  function rascar(ev: EventoPuntero<HTMLCanvasElement>) {
    if (!rascando.current) return;
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    const punto = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    // Una línea desde el punto anterior: un movimiento rápido no deja huecos.
    const desde = ultimo.current ?? punto;
    ctx.beginPath();
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(punto.x + 0.01, punto.y);
    ctx.stroke();
    ultimo.current = punto;
  }

  function medir() {
    rascando.current = false;
    ultimo.current = null;
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || c.width === 0) return;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let vacios = 0;
    // Uno de cada 16 píxeles alcanza para saber cuánto se rascó.
    for (let i = 3; i < data.length; i += 64) if (data[i] === 0) vacios++;
    if (vacios / (data.length / 64) >= RASCADO_SUFICIENTE) setEtapa("pedir");
  }

  async function pedir(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (enviando) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(T.faltaCorreo);
    if (!recibir) return setError(T.faltaCasilla);
    setError(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/cupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), recibir, recordatorios, idiomaWeb: idioma }),
      });
      const json = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(json.error ?? T.fallo);
        return;
      }
      guardar(() => window.localStorage, CLAVE_PEDIDO);
      setEtapa("enviado");
    } catch {
      setError(T.fallo);
    } finally {
      setEnviando(false);
    }
  }

  if (!visible) return null;
  const titulo = `${id}-titulo`;
  const idError = `${id}-error`;

  // Al body: dentro del pie, un ancestro con transform dejaría el `fixed` atado a él.
  return createPortal(
    <div role="dialog" aria-modal="false" aria-labelledby={titulo} className="rsc">
      <button type="button" onClick={cerrar} aria-label={T.cerrar} className="rsc-cerrar">
        <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {etapa === "enviado" ? (
        <div className="rsc-cuerpo" aria-live="polite">
          <p id={titulo} className="rsc-titulo">{T.enviadoTitulo}</p>
          <p className="rsc-texto">{T.enviadoTexto(email.trim())}</p>
        </div>
      ) : (
        <div className="rsc-cuerpo">
          <p id={titulo} className="rsc-titulo">{T.titulo}</p>
          <p className="rsc-nota">{T.noEsSorteo}</p>

          <div className="rsc-tarjeta">
            <p className="rsc-premio" aria-live="polite">{etapa === "rascar" ? "" : T.premio}</p>
            {etapa === "rascar" ? (
              <>
                <span aria-hidden className="rsc-premio rsc-premio-debajo">{T.premio}</span>
                <canvas
                  ref={lienzo}
                  aria-hidden
                  className="rsc-lienzo"
                  onPointerDown={(ev) => {
                    rascando.current = true;
                    ev.currentTarget.setPointerCapture(ev.pointerId);
                    rascar(ev);
                  }}
                  onPointerMove={rascar}
                  onPointerUp={medir}
                  onPointerCancel={medir}
                />
              </>
            ) : null}
          </div>

          {etapa === "rascar" ? (
            <>
              <p className="rsc-nota">{T.pistaRascar}</p>
              <button type="button" className="rsc-boton" onClick={() => setEtapa("pedir")}>{T.rascar}</button>
            </>
          ) : (
            <form onSubmit={pedir} noValidate className="rsc-form">
              <label htmlFor={`${id}-correo`} className="rsc-etiqueta">{T.correo}</label>
              <input
                id={`${id}-correo`}
                type="email"
                className="rsc-campo"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder={T.correoPista}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                {...(error === T.faltaCorreo ? { "aria-invalid": true, "aria-describedby": idError } : {})}
              />
              <label className="rsc-casilla">
                <input type="checkbox" checked={recibir} onChange={(ev) => setRecibir(ev.target.checked)} {...(error === T.faltaCasilla ? { "aria-invalid": true, "aria-describedby": idError } : {})} />
                <span>{T.casillaCupon}</span>
              </label>
              <label className="rsc-casilla">
                <input type="checkbox" checked={recordatorios} onChange={(ev) => setRecordatorios(ev.target.checked)} />
                <span>{T.casillaRecordatorios}</span>
              </label>
              {error ? <p id={idError} role="alert" className="rsc-error">{error}</p> : null}
              <div className="rsc-botones">
                <button type="submit" className="rsc-boton" disabled={enviando}>{enviando ? T.enviando : T.recibir}</button>
                <button type="button" className="rsc-boton" onClick={cerrar}>{T.noGracias}</button>
              </div>
            </form>
          )}

          <p className="rsc-legal">{T.condiciones}</p>
          <p className="rsc-legal">{T.responsable(quien, correo)}</p>
          <p className="rsc-legal">{T.menores}</p>
          <p className="rsc-legal">
            <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")}>{T.privacidad}</Link>
            {" · "}
            <Link prefetch={false} href={ruta(idioma, "/legal/cupon")}>{T.bases}</Link>
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
