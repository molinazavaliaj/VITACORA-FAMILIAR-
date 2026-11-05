import { PUEDE, type Rol } from "@/lib/panel";
import type { PreguntaFamiliaV3 } from "@/lib/v3";
import type { TratoComprador } from "@/lib/regalo-textos";
import { idiomaPreguntasFamilia, textosPanelHistoria } from "@/lib/preguntas-familia-textos";
import { idiomaDelTrato, PANEL, type Quien } from "../../_textos/panel";
import { BannerAlertaSilencio } from "../acciones";
import { textoDudas } from "../proximo-paso";
import { Etiqueta, ProximoPaso } from "../ui";
import { CerrarEdicion, ReabrirEdicion } from "./cerrar-edicion";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { Ajustes, AgregarPregunta, SubirFoto, SumarPreguntaV3 } from "./preguntas/acciones";
import { PreguntasDeLaFamilia } from "./v3";
import type { Ritmo } from "@/lib/guion";

// La historia cuando el libro es para otra persona (Naza y Joaquín, 05/11). Quien regala y sus invitados no ven nada de
// lo que cuenta: ni las respuestas, ni las preguntas como le llegaron (también cuentan cosas), ni lo que pidió sacar. Ven
// el avance (en la cabecera), suman preguntas y fotos y eligen la tapa. Con el libro listo, el libro y las frases.
//
// Esta pantalla no recibe nada de lo contado: es lo que asegura que no llegue al navegador.

type Narrador = { id: string; nombre: string; como_le_dicen: string; estado: string; alerta_silencio: boolean };

const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

/** Lo que pide el guion clásico para sumar una pregunta y sus ajustes. Ningún texto de lo que ya se le mandó. */
export type SumarClasico = {
  capitulos: string[];
  lugarLibre: number;
  ajustes: { evitar: string; pedirFotos: boolean; objetos: { orden: number; capitulo: string; texto: string }[]; trato: { valor: "usted" | "vos" | null; editable: boolean } };
};

export function HistoriaPrivada({
  n, rol, quien, preguntasFamilia, fotos, usuarioId, aprobado, historiaCerrada, libroListo, dudasPendientes, alFinal, ritmo, horario, trato, historia = false, clasico,
}: {
  n: Narrador; rol: Rol; quien: Quien; preguntasFamilia: PreguntaFamiliaV3[]; fotos: FotoVista[]; usuarioId: string;
  aprobado: boolean; historiaCerrada: boolean; libroListo: boolean; dudasPendientes: boolean; alFinal: boolean;
  ritmo: Ritmo; horario?: { hora: string; zona: string }; trato: TratoComprador; historia?: boolean; clasico?: SumarClasico;
}) {
  const T = PANEL[idiomaDelTrato(trato)];
  const TH = textosPanelHistoria(idiomaPreguntasFamilia(trato));
  const tu = trato === "tu";
  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const puedeSumar = !cerrado && !alFinal && PUEDE.agregarPreguntasYFotos(rol);
  const puedeAgregarFotos = !aprobado && !historiaCerrada && PUEDE.agregarPreguntasYFotos(rol);
  const sumar = puedeSumar ? (
    clasico ? (
      <AgregarPregunta narradorId={n.id} capitulos={clasico.capitulos} lugarLibre={clasico.lugarLibre} propia={false} trato={trato} />
    ) : (
      <SumarPreguntaV3 narradorId={n.id} propia={false} trato={trato} ejemplo={historia ? TH.ejemplo : undefined} />
    )
  ) : null;

  return (
    <div className="min-w-0 flex-1">
      {n.alerta_silencio && rol === "duena" ? (
        <div className="mb-8">
          <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} trato={trato} />
        </div>
      ) : null}

      <p className="max-w-prose text-[16px] leading-relaxed text-[var(--texto-suave)]">{T.privadaTexto(quien, rol !== "duena")}</p>

      {cerrado && !aprobado && !historiaCerrada && PUEDE.cerrarLibro(rol) ? (
        <div className="mt-6"><CerrarEdicion narradorId={n.id} propia={false} trato={trato} /></div>
      ) : null}

      {dudasPendientes ? (
        <div className="mt-8">
          <ProximoPaso href={`/tablero/${n.id}/dudas`}>{textoDudas(false, n.como_le_dicen, tu)}</ProximoPaso>
        </div>
      ) : null}

      {libroListo ? (
        <div className="mt-8 flex flex-col gap-3">
          <ProximoPaso href={`/tablero/${n.id}/leer`}>{T.privadaLeer}</ProximoPaso>
          <ProximoPaso href={`/tablero/${n.id}/frases`}>{T.privadaFrases}</ProximoPaso>
        </div>
      ) : aprobado ? (
        <p className="mt-8 text-[15px] text-[var(--texto-suave)]">{T.privadaEscribiendo}</p>
      ) : cerrado && historiaCerrada && PUEDE.cerrarLibro(rol) ? (
        <div className="mt-8 flex flex-col gap-3">
          <ProximoPaso href={`/tablero/${n.id}/libro`}>{T.privadaEncargar}</ProximoPaso>
          <div className="flex items-center gap-3 text-[13px] text-[var(--texto-menor)]">
            <ReabrirEdicion narradorId={n.id} />
          </div>
        </div>
      ) : null}

      {!cerrado && PUEDE.cambiarRitmo(rol) && (horario || clasico) ? (
        <section className="mt-10 border-b border-[var(--linea)] pb-10">
          <Etiqueta>Ajustes de la entrevista</Etiqueta>
          <div className="mt-6">
            {clasico ? (
              <Ajustes narradorId={n.id} ritmo={ritmo} evitar={clasico.ajustes.evitar} horario={horario} propia={false} trato={clasico.ajustes.trato} pedirFotos={clasico.ajustes.pedirFotos} objetos={clasico.ajustes.objetos} tratoPanel={trato} />
            ) : (
              <Ajustes narradorId={n.id} ritmo={ritmo} evitar="" horario={horario} propia={false} v3 tratoPanel={trato} />
            )}
          </div>
        </section>
      ) : null}

      {preguntasFamilia.length > 0 ? (
        <PreguntasDeLaFamilia preguntas={preguntasFamilia} propia={false} trato={trato} historia={historia} privado>{sumar}</PreguntasDeLaFamilia>
      ) : sumar ? (
        <div className="mt-8">{sumar}</div>
      ) : null}

      {fotos.length > 0 || puedeAgregarFotos ? (
        <section aria-labelledby="fotos-del-libro" className="mt-10">
          <div className="border-b border-[var(--linea)] pb-4">
            <h2 id="fotos-del-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El álbum</h2>
          </div>
          <GaleriaCapitulo fotos={fotos} usuarioId={usuarioId} esDuena={rol === "duena"} />
          {puedeAgregarFotos ? (
            <div className="mt-5">
              <SubirFoto narradorId={n.id} capitulos={clasico?.capitulos ?? []} trato={trato}>+ Agregar una foto al álbum</SubirFoto>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
