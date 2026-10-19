import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Acordeon, Boton, Etiqueta, Opcion, Tarjeta } from "../_ui";
import { DemoHoja, DemoPasos, DemoReproductor, DemoTotal } from "./demos";

// Muestra interna del sistema visual del rediseño 2026-10 (fase 0): tokens,
// letras y componentes base sobre el fondo oscuro, para revisarlos en la
// preview antes de usarlos en una pantalla. No es una página del producto:
// en producción no existe (404) y nunca se indexa. Los textos son neutros a
// propósito, nada de ejemplo comercial.

export const metadata: Metadata = {
  title: "Sistema",
  robots: { index: false, follow: false },
};

const COLORES = [
  "--fondo-oscuro",
  "--tarjeta",
  "--tarjeta-alta",
  "--linea-oscura",
  "--borde-oscuro",
  "--borde-oscuro-fuerte",
  "--punto-vacio",
  "--texto-oscuro-menor",
  "--texto-oscuro-suave",
  "--texto-oscuro",
  "--texto-oscuro-fuerte",
  "--elegido-fondo",
  "--acento-oscuro",
  "--boton",
];

const DURACIONES = ["--d-instante", "--d-rapido", "--d-base", "--d-lento", "--d-libro"];

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-[var(--linea-oscura)] pt-10">
      <Etiqueta>{titulo}</Etiqueta>
      {children}
    </section>
  );
}

function Muestras({ viaje = false }: { viaje?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 ${viaje ? "tema-viaje" : ""}`}>
      {COLORES.map((token) => (
        <div key={token} className="flex flex-col gap-2">
          <div className="h-14 rounded-xl border border-[var(--borde-oscuro)]" style={{ background: `var(${token})` }} />
          <code className="text-[12px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{token}</code>
        </div>
      ))}
    </div>
  );
}

export default async function PaginaSistema() {
  // Se decide en cada request: así la misma build sirve en local y en la
  // preview, y en producción da 404.
  await connection();
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="tema-oscuro flex-1">
      <div className="mx-auto flex max-w-[1104px] flex-col gap-12 px-5 py-16 sm:px-10">
        <header className="flex flex-col gap-4">
          <Etiqueta>Sistema · rediseño 2026-10</Etiqueta>
          <h1 className="text-4xl font-medium leading-tight text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)] sm:text-5xl">
            Tokens y componentes base
          </h1>
          <p className="max-w-[640px] text-[17px] leading-relaxed text-[var(--texto-oscuro-suave)]">
            Página interna para revisar el sistema. Los valores salen de web/src/app/globals.css y los componentes de
            web/src/app/_ui/.
          </p>
        </header>

        <Seccion titulo="Colores · Familiar">
          <Muestras />
        </Seccion>

        <Seccion titulo="Colores · Viaje (.tema-viaje)">
          <Muestras viaje />
        </Seccion>

        <Seccion titulo="Letras">
          <div className="flex flex-col gap-4">
            <p className="text-4xl font-medium text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
              Titular en Playfair 500
            </p>
            <p className="text-4xl font-medium italic text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
              Titular en Playfair 500 itálica
            </p>
            <p className="text-lg text-[var(--texto-oscuro)]">Texto en Source Serif 4, 400.</p>
            <p className="text-lg font-light text-[var(--texto-oscuro)]">Texto en Source Serif 4, 300.</p>
            <p className="text-lg italic text-[var(--texto-oscuro)]">Texto en Source Serif 4, itálica.</p>
            <p className="text-[15px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)]">
              Interfaz en Archivo 400 · <span className="font-medium">500</span> ·{" "}
              <span className="font-semibold">600</span>
            </p>
          </div>
        </Seccion>

        <Seccion titulo="Movimiento">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {DURACIONES.map((d) => (
              <Tarjeta key={d} className="p-4">
                <code className="text-[13px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)]">{d}</code>
              </Tarjeta>
            ))}
          </div>
          <p className="text-[15px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
            --ease-out: cubic-bezier(.2, .7, .2, 1) · --ease-io: cubic-bezier(.65, 0, .35, 1)
          </p>
        </Seccion>

        <Seccion titulo="Botones">
          <div className="flex flex-wrap items-center gap-4">
            <Boton>Botón primario</Boton>
            <Boton variante="fantasma">Botón fantasma</Boton>
            <Boton href="/sistema">Enlace con forma de botón</Boton>
            <Boton disabled>Botón desactivado</Boton>
          </div>
          <div className="tema-viaje flex flex-wrap items-center gap-4">
            <Boton>Botón primario (Viaje)</Boton>
            <Boton variante="fantasma">Botón fantasma (Viaje)</Boton>
          </div>
        </Seccion>

        <Seccion titulo="Etiquetas">
          <div className="flex flex-wrap items-center gap-4">
            <Etiqueta>Etiqueta suelta</Etiqueta>
            <Etiqueta rellena>Etiqueta rellena</Etiqueta>
          </div>
        </Seccion>

        <Seccion titulo="Tarjetas">
          <div className="grid gap-4 sm:grid-cols-2">
            <Tarjeta>
              <p className="text-xl text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">Título de tarjeta</p>
              <p className="mt-2 text-[var(--texto-oscuro-suave)]">Texto de tarjeta, en Source Serif sobre la superficie.</p>
            </Tarjeta>
            <Tarjeta className="bg-[var(--tarjeta-alta)]">
              <p className="text-xl text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">Tarjeta alta</p>
              <p className="mt-2 text-[var(--texto-oscuro-suave)]">Una superficie arriba de la tarjeta.</p>
            </Tarjeta>
          </div>
          <Tarjeta>
            <DemoTotal />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Opciones">
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Opciones de ejemplo</legend>
            <Opcion name="ejemplo" value="a" titulo="Opción A" detalle="Detalle de la opción A." precio="10" defaultChecked />
            <Opcion
              name="ejemplo"
              value="b"
              titulo="Opción B"
              detalle="Detalle de la opción B, con una etiqueta arriba."
              precio="15"
              etiqueta={<Etiqueta rellena>Etiqueta</Etiqueta>}
            />
            <Opcion name="ejemplo" value="c" titulo="Opción desactivada" disabled />
          </fieldset>
          <Opcion tipo="checkbox" name="extra" titulo="Casilla" detalle="La misma opción, como casilla." />
          <div className="tema-viaje">
            <Opcion tipo="checkbox" name="extra-viaje" titulo="Casilla (Viaje)" defaultChecked />
          </div>
        </Seccion>

        <Seccion titulo="Acordeón">
          <div className="border-t border-[var(--linea-oscura)]">
            <Acordeon pregunta="Primera pregunta de ejemplo" grupo="sistema">
              Respuesta de ejemplo. Se despliega hacia abajo y el más gira hasta ser una cruz.
            </Acordeon>
            <Acordeon pregunta="Segunda pregunta de ejemplo" grupo="sistema">
              Otra respuesta. Con el mismo grupo, abrir esta cierra la otra.
            </Acordeon>
          </div>
        </Seccion>

        <Seccion titulo="Hoja">
          <div>
            <DemoHoja />
          </div>
        </Seccion>

        <Seccion titulo="Pasos">
          <Tarjeta>
            <DemoPasos />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Reproductor">
          <Tarjeta>
            <DemoReproductor />
          </Tarjeta>
        </Seccion>
      </div>
    </main>
  );
}
