import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { claveDeMes, leerContenido, mesDe, mesVecino } from "@/lib/admin/contenido";
import { Cifra, Nota, Titulo } from "../ui";
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
  const boton = "adm-boton adm-boton--hilo adm-boton--chico";

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/contenido">
        A la izquierda, la carpeta con todo lo que se fue subiendo. A la derecha, el mes: arrastren cada pieza al día
        en que sale y tóquenla para escribirle el texto, la red y la hora.
      </Titulo>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cifra etiqueta="En la carpeta" valor={piezas.filter((p) => p.fecha === null).length} detalle="subidas, sin día todavía" />
        <Cifra
          etiqueta="Programadas este mes"
          valor={programadas.length}
          detalle={`${programadas.filter((p) => p.estado === "listo").length} listas para salir`}
        />
        <Cifra
          etiqueta="Publicadas"
          valor={programadas.filter((p) => p.estado === "publicado").length}
          color="verde"
          detalle="las que ya salieron este mes"
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/admin/contenido?mes=${anterior}`} className={boton} aria-label="mes anterior">
            ←
          </Link>
          <h2 className="min-w-[11ch] text-center text-2xl first-letter:uppercase [font-family:var(--fuente-titulo)]">
            {NOMBRE_MES.format(new Date(Date.UTC(mes.anio, mes.mes - 1, 1)))}
          </h2>
          <Link href={`/admin/contenido?mes=${siguiente}`} className={boton} aria-label="mes siguiente">
            →
          </Link>
          <Link href="/admin/contenido" className={boton}>
            hoy
          </Link>
        </div>
      </div>

      {error ? (
        <p className="adm-alerta mt-4">{error}</p>
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
