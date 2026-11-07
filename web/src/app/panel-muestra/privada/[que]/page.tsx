import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { idiomaDelTrato, PANEL, type Quien } from "../../../_textos/panel";
import { MarcoHistoria } from "../../../tablero/_historia/marco";
import { CifrasHistoria, PortadaHistoria } from "../../../tablero/_historia/portada";
import { EnlaceDudas, HojaFamilia, HojaFotos, HojaPedido } from "../../../tablero/_historia/lateral";
import { HistoriaPrivada } from "../../../tablero/[narradorId]/privada";
import { Compartir } from "../../../tablero/[narradorId]/compartir";
import { SubirFoto } from "../../../tablero/[narradorId]/preguntas/acciones";
import { FrasesElegidas } from "../../../tablero/[narradorId]/frases/elegidas";
import { Wizard } from "../../../tablero/[narradorId]/libro/wizard";
import { lineaDeTiempo, titularDe } from "../../../tablero/momento";
import { estadoEnHumano } from "../../../tablero/ui";
import { BotonTema } from "../../../tablero/tema";
import { Navegacion } from "../../../tablero/nav";
import { Aviso, VistaRespuestas } from "../../../mis-respuestas/[token]/vista";
import { VistaDudas, VistaGracias } from "../../../mi-historia/[token]/vista";
import { textosMiHistoria, type IdiomaMiHistoria } from "@/lib/mi-historia-textos";
import type { TratoComprador } from "@/lib/regalo-textos";
import "../../../tablero/panel.css";

// Las pantallas de la privacidad del panel con datos de mentira, para mirarlas y mostrárselas a Naza sin tocar la base.
// Como el resto de /panel-muestra, no existe en producción.

export const metadata: Metadata = { title: "Muestra", robots: { index: false, follow: false } };

const n = { id: "m1", nombre: "Antonio García", como_le_dicen: "Antonio", estado: "activo", alerta_silencio: false };
const quien: Quien = { como: "Antonio", propia: false, ella: false, viaje: false };
const preguntas = [
  { id: "p1", texto: "¿Cómo conociste a la abuela?", estado: "por hacer" as const },
  { id: "p2", texto: "¿Qué música escuchabas de chico?", estado: "contestada" as const },
];

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div id="panel" className="pnl flex min-h-dvh flex-1 flex-col text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
      <Navegacion historias={[{ id: n.id, nombre: n.nombre, comoLeDicen: n.como_le_dicen, rol: "duena", propia: false, estadoCorto: "respondiendo" }]} tema={<BotonTema inicial="claro" />} correo="laura@ejemplo.com" inicial="L" />
      <main className="relative min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}

function Historia({ rol, listo, trato, quedanPreguntas = 0 }: { rol: "duena" | "invitado"; listo: boolean; trato: TratoComprador; quedanPreguntas?: number }) {
  const idioma = idiomaDelTrato(trato);
  const estado = listo || quedanPreguntas > 0 ? "completado" : "activo";
  const contacto = { whatsapp: null, correo: "soporte@vitacorafamiliar.com" };
  return (
    <MarcoHistoria
      cabecera={
        <PortadaHistoria
          idioma={idioma}
          quien={quien}
          hola={rol === "duena" ? "Laura" : null}
          titular={titularDe(estado, listo, listo)}
          estado={estadoEnHumano(estado, false, trato)}
          tapa={{ titulo: n.nombre, fotoSrc: null, idioma: "es" }}
          pasos={lineaDeTiempo({ estado, aprobado: listo, libroEntregado: listo, conImpreso: true, impresoEnCasa: false })}
          cifras={<CifrasHistoria idioma={idioma} quien={quien} respuestas={23} segundos={0} avance={listo ? 100 : 47} />}
        />
      }
      arriba={!listo ? <HojaFotos idioma={idioma} quien={quien} fotos={[]} hayPortada={false} subir={<SubirFoto narradorId={n.id} capitulos={[]} variante="barra" trato={trato}>Agregar fotos</SubirFoto>} /> : null}
      cuerpo={
        <HistoriaPrivada n={{ ...n, estado }} rol={rol} quien={quien} preguntasFamilia={listo ? [] : preguntas} fotos={[]} usuarioId="u1" aprobado={listo} historiaCerrada={false} libroListo={listo} quedanPreguntas={quedanPreguntas} alFinal={listo} ritmo="diario" horario={rol === "duena" && !listo ? { hora: "10:00", zona: "Europe/Madrid" } : undefined} trato={trato} />
      }
      abajo={
        <>
          {rol === "duena" ? (
            <HojaFamilia idioma={idioma} quien={quien}>
              <Compartir narradorId={n.id} nombre={n.nombre} cerrado={listo} aprobado={listo} linkPublico={listo ? "https://www.vitacorafamiliar.com/libro/ejemplo" : null} invitados={[]} trato={trato} privado />
            </HojaFamilia>
          ) : null}
          {rol === "duena" ? <HojaPedido idioma={idioma} quien={quien} momento={listo ? "listo" : "marcha"} lineas={{ impresos: 1, marcos: 0 }} contacto={contacto} /> : null}
          <EnlaceDudas idioma={idioma} contacto={contacto} />
        </>
      }
    />
  );
}

const frase = (id: string, texto: string) => ({ id, texto, origen: "cita" as const, grupo: null, respuesta_id: null, pregunta_orden: 0, por_que: "", elegida: true, elegida_por: "modelo" as const, estado: "cortada" as const, audio_path: "x", segundos: 7, inicio: 0, fin: 7 });
const respuesta = (id: string, texto: string, fuera = false) => ({ id, texto, audio: true, duracion: 42, recibidoAt: "2026-11-01T10:00:00Z", fuera });

export default async function Muestra({ params, searchParams }: { params: Promise<{ que: string }>; searchParams: Promise<{ tu?: string; idioma?: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { que } = await params;
  const { tu, idioma: idiomaPedido } = await searchParams;
  const trato: TratoComprador = tu ? "tu" : "vos";
  const T = PANEL[idiomaDelTrato(trato)];
  void T;
  if (que === "regalo") return <Panel><Historia rol="duena" listo={false} trato={trato} /></Panel>;
  if (que === "invitado") return <Panel><Historia rol="invitado" listo={false} trato={trato} /></Panel>;
  // Quien regala, mientras quien contó contesta: solo cuántas faltan.
  if (que === "regalo-dudas") return <Panel><Historia rol="duena" listo={false} trato={trato} quedanPreguntas={3} /></Panel>;
  if (que === "listo") return <Panel><Historia rol="duena" listo trato={trato} /></Panel>;
  if (que === "frases") {
    return (
      <Panel>
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <FrasesElegidas narradorId={n.id} nombre="Antonio" capitulos={[{ numero: 1, capitulo: "La infancia", candidatas: [frase("a", "Ejemplo de frase elegida por el biógrafo."), frase("b", "Otra frase de ejemplo, con su audio.")] }]} confirmadoAt={null} frenada={false} cortando={false} puedeConfirmar linkPublico="https://www.vitacorafamiliar.com/voz/ejemplo" trato={trato} />
        </div>
      </Panel>
    );
  }
  if (que === "encargar") {
    const edicion = { titulo: "Antonio García", subtitulo: "", portadaFotoId: null, contratapaFotoId: null, marcoFotoId: null, marcosFotoIds: [], ordenCapitulos: [], titulosCapitulos: {}, excluidas: [], correcciones: "" };
    return (
      <Panel>
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <Wizard narradorId={n.id} nombre={n.nombre} edicion={edicion} capitulos={[]} respuestas={[]} fotos={[]} nombresRevisados={false} v3={[]} privado trato={trato} />
        </div>
      </Panel>
    );
  }
  if (que === "link" || que === "link-cerrado") {
    const bloques = [{ nombre: "Origen y raíces", preguntas: [
      { clave: "OR1", pregunta: "¿Dónde naciste?", estado: "contestada" as const, reservada: false, respuestas: [respuesta("r1", "Texto de ejemplo de una respuesta.")] },
      { clave: "OR2", pregunta: "¿Cómo era tu casa?", estado: "contestada" as const, reservada: false, respuestas: [respuesta("r2", "Otra respuesta de ejemplo, ya sacada del libro.", true)] },
    ] }];
    return <VistaRespuestas idioma={trato === "tu" ? "es-ES" : "es-AR"} bloques={bloques} puede={que === "link"} hasta={que === "link" ? "sábado 7 de noviembre a las 18:30" : null} token="ejemplo" privado narradorId={n.id} />;
  }
  // La pantalla de dudas de quien contó, en sus tres idiomas (?idioma=es-ES o ?idioma=ca).
  if (que === "dudas" || que === "dudas-gracias" || que === "dudas-para-mi" || que === "dudas-libro") {
    const lengua: IdiomaMiHistoria = idiomaPedido === "es-ES" || idiomaPedido === "ca" ? idiomaPedido : "es-AR";
    const linkLibro = que === "dudas-para-mi" ? `/tablero/${n.id}/libro` : null;
    if (que === "dudas-gracias") return <VistaGracias idioma={lengua} linkLibro={null} />;
    if (que === "dudas-libro") return <Aviso titulo={textosMiHistoria(lengua).libroEscrito} texto="" />;
    const preguntasDudas = [
      { id: "D1", numero: 1, pregunta: "¿Cómo se llamaba la maestra que te enseñó a leer?", citas: ["Ejemplo de frase. La señorita me sentaba adelante porque hablaba mucho."], opciones: ["Elena", "Helena"] },
      { id: "D2", numero: 2, pregunta: "¿En qué año se mudaron a la casa del río?", citas: [], opciones: [] },
      { id: "D3", numero: 3, pregunta: "¿Quién manejaba el camión aquel verano?", citas: ["Otra frase de ejemplo. El camión era viejo y nos llevaba a todos."], opciones: [] },
    ];
    return <VistaDudas idioma={lengua} token="ejemplo" total={preguntasDudas.length} preguntas={preguntasDudas} linkLibro={linkLibro} muestra />;
  }
  notFound();
}
