import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { ViajeVista } from "../../tablero/[narradorId]/viaje";
import { Navegacion } from "../../tablero/nav";
import { BotonTema } from "../../tablero/tema";
import { HistoriaV3 } from "../../tablero/[narradorId]/v3";
import { HistoriaViaje } from "../../tablero/[narradorId]/viaje";
import { Compartir } from "../../tablero/[narradorId]/compartir";
import { SubirFoto } from "../../tablero/[narradorId]/preguntas/acciones";
import { CierreAnticipado } from "../../tablero/acciones";
import { estadoEnHumano } from "../../tablero/ui";
import { MarcoHistoria } from "../../tablero/_historia/marco";
import { CifrasHistoria, PortadaHistoria } from "../../tablero/_historia/portada";
import { EnlaceDudas, HojaFamilia, HojaFotos, HojaPedido, HojaUltimo, HojaWhatsApp } from "../../tablero/_historia/lateral";
import { vozV3, vozViaje } from "../../tablero/_historia/voz";
import { lineaDeTiempo, momentoDe, titularDe, type Momento } from "../../tablero/momento";
import { LibroDelEstante } from "../../tablero/_historia/estante";
import { Contenedor } from "../../tablero/ui";
import type { Historia } from "@/lib/panel";
import { PANEL, type IdiomaPanel, type Quien } from "../../_textos/panel";
import "../../_direccion/tokens.css";
import "../../tablero/panel.css";
import { bloquesV3, haceDias, hoyMas } from "../datos";

// La muestra del panel (rediseño 2026-10, fase 2): SOLO para mirarlo en local
// y en la preview, sin sesión ni base. Pinta las mismas piezas que
// /tablero/[narradorId] con datos de prueba en memoria, en los tres momentos,
// para la V3 y el viaje: /panel-muestra/v3-marcha, /panel-muestra/viaje-antes…
// ?tema=oscuro para la tinta, ?idioma=ar para el vos. En producción no existe
// (404). Todo lo que se ve acá es inventado: nombres, audios, teléfono.

export const metadata: Metadata = { title: "Muestra del panel", robots: { index: false, follow: false } };

const MOMENTOS: Momento[] = ["antes", "marcha", "listo"];

/** El viaje de prueba (V2): Sara, a Portugal, para ella, impreso y con álbum de 20. */
function viajeDe(momento: Momento): ViajeVista {
  const salida = momento === "antes" ? 12 : momento === "marcha" ? -2 : -30;
  return {
    v: 2,
    salida: hoyMas(salida),
    vuelta: hoyMas(salida + 7),
    zonaCasa: "Europe/Madrid",
    zonaViaje: "Europe/Lisbon",
    preguntasPropias: [],
    formato: "impreso",
    fotosAlbum: 20,
    idioma: "es-ES",
  };
}

const RESPUESTAS_VIAJE = [
  "Subimos al mirador cuando ya caía el sol. Abajo el río parecía de cobre y nadie hablaba.",
  "Cenamos en una casa de comidas con cuatro mesas. El dueño nos trajo sardinas que no habíamos pedido.",
  "Nos perdimos en el tren a Sintra y acabamos en un pueblo con una sola panadería. Fue lo mejor del día.",
];

/** El Inicio de prueba: dos libros en el estante, uno contándose y otro esperando el regalo. */
function InicioMuestra({ idioma }: { idioma: IdiomaPanel }) {
  const region = idioma === "es" ? "ES" : "AR";
  const sinPedido = { impresos: 1, marcos: 0, libroEntregado: false, impresoEnCasa: false, direccionEditable: true };
  const libro = (id: string, nombre: string, como: string, estado: string, genero: string): Historia => ({
    rol: "duena",
    narrador: { id, nombre, como_le_dicen: como, estado, dia_actual: 4, alerta_silencio: false, familia_id: "f1", created_at: haceDias(20), contexto: { genero, vinculoComprador: "hija" } },
  });
  return (
    <Contenedor ancho="max-w-[1040px]">
      <h1 className="pnl-titular">
        <span className="block italic text-[var(--texto-suave)]">{PANEL[idioma].hola("Laura")}</span>
        Tus historias
      </h1>
      <ol className="pnl-entra mt-10 flex flex-col md:mt-14">
        <LibroDelEstante
          h={libro("m1", "Antonio García", "Antonio", "activo", "varon")}
          r={{ respondidas: 11, total: 30, segundos: 2040, tieneAnticipo: false, v3: true, aprobado: false, portadaFotoId: null, titulo: null, pedido: sinPedido }}
          region={region}
          fotoSrc="/rediseno/libro-tapa-foto.jpg"
        />
        <LibroDelEstante
          h={libro("m2", "Carmen Ruiz", "Carmen", "regalo_pendiente", "mujer")}
          r={{ respondidas: 0, total: 30, segundos: 0, tieneAnticipo: false, v3: true, aprobado: false, portadaFotoId: null, titulo: null, pedido: { ...sinPedido, impresos: 0 } }}
          region={region}
        />
      </ol>
    </Contenedor>
  );
}

export default async function MuestraPanel({ params, searchParams }: PageProps<"/panel-muestra/[vista]">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { vista } = await params;
  const sp = await searchParams;
  if (vista === "inicio") {
    const oscuroInicio = sp.tema === "oscuro";
    const idiomaInicio: IdiomaPanel = sp.idioma === "ar" ? "ar" : "es";
    return (
      <div id="panel" className={`pnl ${oscuroInicio ? "oscuro" : ""} flex min-h-dvh flex-1 flex-col text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
        <Navegacion
          historias={[
            { id: "m1", nombre: "Antonio García", comoLeDicen: "Antonio", rol: "duena", estadoCorto: "respondiendo" },
            { id: "m2", nombre: "Carmen Ruiz", comoLeDicen: "Carmen", rol: "duena", estadoCorto: "esperando que abra su regalo" },
          ]}
          tema={<BotonTema inicial={oscuroInicio ? "oscuro" : "claro"} />}
          correo="laura@ejemplo.com"
          inicial="L"
        />
        <main className="relative min-w-0 flex-1 pb-24 md:pb-0">
          <InicioMuestra idioma={idiomaInicio} />
        </main>
      </div>
    );
  }
  const [tipo, momentoUrl] = vista.split("-") as [string, Momento];
  if ((tipo !== "v3" && tipo !== "viaje") || !MOMENTOS.includes(momentoUrl)) notFound();
  const momento = momentoUrl;
  const oscuro = sp.tema === "oscuro";
  const idioma: IdiomaPanel = sp.idioma === "ar" ? "ar" : "es";
  const trato = idioma === "es" ? "tu" : "vos";
  const viaje = tipo === "viaje";

  const estado = momento === "antes" ? (viaje ? "acepto" : "regalo_pendiente") : momento === "marcha" ? "activo" : "completado";
  const aprobado = momento === "listo";
  const quien: Quien = viaje ? { como: "Sara", propia: true, ella: true, viaje: true } : { como: "Antonio", propia: false, ella: false, viaje: false };
  const n = { id: `muestra-${tipo}`, nombre: viaje ? "Sara Molina" : "Antonio García", como_le_dicen: quien.como, estado, dia_actual: momento === "antes" ? 0 : 3, alerta_silencio: false };
  const historiasRiel = [{ id: n.id, nombre: n.nombre, rol: "duena" as const, estado, propia: viaje }];
  const pedido = { impresos: 1, marcos: momento === "listo" ? 1 : 0, libroEntregado: momento === "listo", impresoEnCasa: false };
  const fotosMuestra = momento === "antes" ? [] : [
    { id: "f1", epigrafe: null, src: viaje ? "/rediseno/viaje-mirador-lisboa.jpg" : "/rediseno/para-tu-padre.jpg" },
    { id: "f2", epigrafe: null, src: viaje ? "/rediseno/marco-en-casa.jpg" : "/rediseno/osvaldo-guitarra.jpg" },
    { id: "f3", epigrafe: null, src: viaje ? "/checkout/marco-viaje.jpg" : "/rediseno/para-tu-abuelo.jpg" },
  ];
  const tapaFoto = momento === "antes" ? null : viaje ? "/rediseno/viaje-mirador-lisboa.jpg" : "/rediseno/libro-tapa-foto.jpg";
  const contacto = { whatsapp: null, correo: "hola@vitacorafamiliar.com" };

  let cuerpo: ReactNode;
  let voz;
  const subir = !aprobado ? (
    <SubirFoto narradorId={n.id} capitulos={[]} variante="barra" trato={trato}>
      Agregar fotos
    </SubirFoto>
  ) : undefined;
  if (viaje) {
    const v = viajeDe(momento);
    const noches = momento === "antes" ? 0 : 3;
    const respuestas = Array.from({ length: noches }, (_, i) => ({
      id: `rv${i + 1}`,
      pregunta_orden: i + 1,
      audio_path: "muestra.ogg",
      texto_directo: null,
      transcripcion: RESPUESTAS_VIAJE[i],
      duracion_segundos: [212, 175, 260][i],
      es_repregunta: false,
      recibido_at: `${hoyMas(-2 + i)}T21:40:00Z`,
    }));
    voz = vozViaje(respuestas, (r) => new Date(`${r.recibido_at.slice(0, 10)}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" }));
    cuerpo = (
      <HistoriaViaje
        n={n}
        rol="duena"
        viaje={v}
        respuestas={respuestas}
        fotos={[]}
        usuarioId="u1"
        aprobado={aprobado}
        historiaCerrada={false}
        puedeCambiarFechas={momento === "antes"}
        trato={trato}
      />
    );
  } else {
    const bloques = bloquesV3(momento);
    voz = vozV3(bloques);
    cuerpo = (
      <HistoriaV3
        enMarco
        n={n}
        rol="duena"
        propia={false}
        bloques={bloques}
        fotos={[]}
        usuarioId="u1"
        historiasRiel={historiasRiel}
        aprobado={aprobado}
        historiaCerrada={false}
        linkPublico={null}
        invitados={[]}
        ritmo="diario"
        horario={momento === "listo" ? undefined : { hora: "10:00", zona: "Europe/Madrid" }}
        alFinal={false}
        trato={trato}
      />
    );
  }

  return (
    <div id="panel" className={`pnl ${oscuro ? "oscuro" : ""} flex min-h-dvh flex-1 flex-col text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
      <Navegacion
        historias={[{ id: n.id, nombre: n.nombre, comoLeDicen: n.como_le_dicen, rol: "duena", propia: viaje, estadoCorto: "respondiendo" }]}
        tema={<BotonTema inicial={oscuro ? "oscuro" : "claro"} />}
        correo="laura@ejemplo.com"
        inicial={viaje ? "S" : "L"}
      />
      <main className="relative min-w-0 flex-1 pb-24 md:pb-0">
        <MarcoHistoria
          producto={viaje ? "viaje" : undefined}
          cabecera={
            <PortadaHistoria
              idioma={idioma}
              quien={quien}
              hola={viaje ? "Sara" : "Laura"}
              titular={titularDe(estado, aprobado, pedido.libroEntregado)}
              estado={estadoEnHumano(estado, quien.propia, trato)}
              tapa={{ titulo: n.nombre, fotoSrc: tapaFoto, idioma: "es" }}
              pasos={lineaDeTiempo({ estado, aprobado, libroEntregado: pedido.libroEntregado, conImpreso: true, impresoEnCasa: false })}
              cifras={<CifrasHistoria idioma={idioma} quien={quien} respuestas={voz.respuestas} segundos={voz.segundos} />}
              hrefTapa="#"
            />
          }
          arriba={
            <>
              {momento === "antes" ? <HojaWhatsApp idioma={idioma} quien={quien} telefono={viaje ? "+34 600 000 000" : null} hrefTarjeta={viaje ? undefined : "#"} /> : null}
              <HojaUltimo idioma={idioma} quien={quien} ultimas={voz.ultimas} hrefTodo="#lo-contado" ahora={new Date()} />
              {!aprobado ? <HojaFotos idioma={idioma} quien={quien} fotos={fotosMuestra} hayPortada={Boolean(tapaFoto)} subir={subir} hrefTapa="#" /> : null}
            </>
          }
          cuerpo={cuerpo}
          abajo={
            <>
              <HojaFamilia idioma={idioma} quien={quien}>
                <Compartir narradorId={n.id} nombre={n.nombre} cerrado={estado === "completado"} aprobado={aprobado} linkPublico={aprobado ? "https://www.vitacorafamiliar.com/libro/muestra" : null} invitados={[]} trato={trato} />
              </HojaFamilia>
              <HojaPedido
                idioma={idioma}
                quien={quien}
                momento={momentoDe(estado, aprobado)}
                lineas={{ impresos: pedido.impresos, marcos: pedido.marcos }}
                hrefDireccion="#"
                hrefMarco={pedido.marcos === 0 ? "#" : undefined}
                contacto={contacto}
                cierre={momento === "marcha" ? <CierreAnticipado narradorId={n.id} trato={trato} /> : undefined}
              />
              <EnlaceDudas idioma={idioma} contacto={contacto} />
            </>
          }
        />
      </main>
    </div>
  );
}
