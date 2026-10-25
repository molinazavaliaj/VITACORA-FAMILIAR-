import { bloquesV3 } from "../panel-muestra/datos";
import { Navegacion } from "../tablero/nav";
import { BotonTema } from "../tablero/tema";
import { estadoEnHumano } from "../tablero/ui";
import { MarcoHistoria } from "../tablero/_historia/marco";
import { CifrasHistoria, PortadaHistoria } from "../tablero/_historia/portada";
import { HojaUltimo } from "../tablero/_historia/lateral";
import { vozV3 } from "../tablero/_historia/voz";
import { lineaDeTiempo, titularDe } from "../tablero/momento";
import type { IdiomaPanel, Quien } from "../_textos/panel";
import "../_direccion/tokens.css";
import "../tablero/panel.css";

// Lo que se ve adentro del teléfono de la portada (/telefono-historia): la parte de
// arriba de la página de su historia, con las MISMAS piezas del panel
// (cabecera de tinta, tapa, «Hola, Laura.», cifras, línea de tiempo y «Lo
// último que contó») y los datos inventados de la muestra (Antonio, contado a
// medias; panel-muestra/datos.ts). Va en un iframe de 390 px achicado: así
// las piezas se pintan con los cortes del teléfono aunque la portada se mire
// en una pantalla grande. Todo quieto (inert): es una ilustración.

const QUIEN: Quien = { como: "Antonio", propia: false, ella: false, viaje: false };
const ESTADO = "activo";

export function PanelEnTelefono({ idioma }: { idioma: IdiomaPanel }) {
  const trato = idioma === "es" ? "tu" : "vos";
  const voz = vozV3(bloquesV3("marcha"));
  return (
    <div inert id="panel" className="pnl flex min-h-dvh flex-1 flex-col overflow-hidden text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
      <Navegacion
        historias={[{ id: "muestra-v3", nombre: "Antonio García", comoLeDicen: "Antonio", rol: "duena", estadoCorto: "respondiendo" }]}
        tema={<BotonTema inicial="claro" />}
        correo="laura@ejemplo.com"
        inicial="L"
      />
      <main className="relative min-w-0 flex-1">
        <MarcoHistoria
          cabecera={
            <PortadaHistoria
              idioma={idioma}
              quien={QUIEN}
              hola="Laura"
              titular={titularDe(ESTADO, false, false)}
              estado={estadoEnHumano(ESTADO, false, trato)}
              tapa={{ titulo: "Antonio García", fotoSrc: "/rediseno/libro-tapa-foto.jpg", idioma: "es" }}
              pasos={lineaDeTiempo({ estado: ESTADO, aprobado: false, libroEntregado: false, conImpreso: true, impresoEnCasa: false })}
              cifras={<CifrasHistoria idioma={idioma} quien={QUIEN} respuestas={voz.respuestas} segundos={voz.segundos} avance={47} />}
            />
          }
          // Los dos audios más nuevos (la muestra trae tres).
          arriba={<HojaUltimo idioma={idioma} quien={QUIEN} ultimas={voz.ultimas.slice(0, 2)} hrefTodo="#" ahora={new Date()} />}
          cuerpo={null}
          abajo={null}
        />
      </main>
    </div>
  );
}
