import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { claveDeMes, leerContenido, mesDe, mesVecino } from "@/lib/admin/contenido";
import { Nota, Titulo } from "../ui";
import { Calendario } from "./calendario";

// 09 · Contenido — «qué publicamos y cuándo». La carpeta con lo que se fue subiendo y el
// calendario del mes para acomodarlo. Sólo planifica: no publica en ninguna red.

const NOMBRE_MES = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function PantallaContenido({ searchParams }: PageProps<"/admin/contenido">) {
  const ahora = new Date();
  const { mes: param } = await searchParams;
  const mes = mesDe(param, ahora);
  const { piezas, error } = await leerContenido(crearClienteServidor(), mes);

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(ahora);
  const anterior = claveDeMes(mesVecino(mes, -1));
  const siguiente = claveDeMes(mesVecino(mes, 1));
  const programadas = piezas.filter((p) => p.fecha !== null && p.fecha.startsWith(claveDeMes(mes)));
  const boton = "rounded border border-[var(--linea-fuerte)] px-2 py-0.5 text-sm text-[var(--texto-suave)] hover:bg-[var(--hueco)]";

  return (
    <div>
      <Titulo numero="09" nombre="Contenido" aclara="qué publicamos y cuándo" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/admin/contenido?mes=${anterior}`} className={boton} aria-label="mes anterior">
            ←
          </Link>
          <h2 className="min-w-[10ch] text-center text-lg first-letter:uppercase [font-family:var(--fuente-titulo)]">
            {NOMBRE_MES.format(new Date(Date.UTC(mes.anio, mes.mes - 1, 1)))}
          </h2>
          <Link href={`/admin/contenido?mes=${siguiente}`} className={boton} aria-label="mes siguiente">
            →
          </Link>
          <Link href="/admin/contenido" className={boton}>
            hoy
          </Link>
        </div>
        <p className="text-sm text-[var(--texto-menor)]">
          {programadas.length} {programadas.length === 1 ? "publicación" : "publicaciones"} este mes ·{" "}
          {programadas.filter((p) => p.estado === "publicado").length} publicadas
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">{error}</p>
      ) : (
        <Calendario inicial={piezas} mes={mes} hoy={hoy} />
      )}

      <Nota>
        Subí lo que vayan teniendo a la carpeta y arrastralo al día en que sale. Tocar una pieza abre su ficha: el texto,
        la red, la hora y si ya está lista o publicada. El calendario sólo ordena: no publica nada solo en ninguna red.
      </Nota>
    </div>
  );
}
