import type { ReactNode } from "react";
import { TITULARES } from "../titulares";
import { Correo, DatosTitular, Enlace, Lista, Pagina, Parrafo, Seccion, Tabla } from "../ui";

// Política de privacidad. Requisito duro de la API de WhatsApp (Meta pide una
// URL que explique qué se hace con los mensajes) y del RGPD / ley 25.326.
//
// Todo lo que se afirma acá es lo que el código hace de verdad: las tablas de
// supabase/migrations, los proveedores de web/, entrevistador/ y fabrica/.
// Si se suma un proveedor o un dato nuevo, esta página cambia en el mismo PR.
//
// Dos responsables, uno por mercado (ver ../titulares.ts). La voz del narrador
// clonada para el audiolibro es un dato biométrico: solo con su consentimiento
// explícito, y se nombra como tal.
//
// Región de Railway: hoy corre en Estados Unidos (región por defecto). Si se
// mueve a Europa, corregir la tabla de la sección 5.

export const metadata = {
  title: "Privacidad",
  description: "Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.",
};

const F = ({ children }: { children: ReactNode }) => <strong className="font-medium">{children}</strong>;

export default function Privacidad() {
  const es = TITULARES.ES;
  const ar = TITULARES.AR;

  return (
    <Pagina titulo="Privacidad" bajada="Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.">
      <Seccion id="responsables" titulo="1. Quién responde por tus datos">
        <Parrafo>
          El responsable del tratamiento es el titular del servicio en tu región, la que
          elegiste al comprar:
        </Parrafo>
        <Lista
          items={[
            <>
              <F>España</F>: <DatosTitular titular={es} />.
            </>,
            <>
              <F>Argentina</F>: <DatosTitular titular={ar} />.
            </>,
          ]}
        />
        <Parrafo>
          Para cualquier cosa sobre tus datos escribe a <Correo cual="hola" />. No hace falta
          formulario ni formalidad: un correo alcanza.
        </Parrafo>
      </Seccion>

      <Seccion id="a-quien" titulo="2. A quién aplica">
        <Parrafo>Esta política habla de cuatro personas distintas:</Parrafo>
        <Lista
          items={[
            <>
              <F>Quien compra</F> y tiene la cuenta (llamémosla «tú»).
            </>,
            <>
              <F>El narrador</F>: la persona a la que entrevistamos por WhatsApp.
            </>,
            <>
              <F>Los invitados</F>: familiares a los que invitas a leer el libro y subir fotos.
            </>,
            <>
              <F>Quien visita la web</F> sin cuenta, o abre la muestra pública de un libro.
            </>,
          ]}
        />
      </Seccion>

      <Seccion id="que-datos" titulo="3. Qué datos guardamos">
        <Parrafo>
          <F>De ti</F>: tu nombre, tu correo, la región que elegiste, y qué compraste, cuándo y
          por qué medio. Tu tarjeta no la vemos nunca: la cobra Stripe o Mercado Pago y a
          nosotros nos llega solo la confirmación. Cuando entras a tu cuenta guardamos los
          registros técnicos normales de cualquier web (dirección IP, navegador, hora).
        </Parrafo>
        <Parrafo>
          <F>Del narrador</F>: su nombre y cómo le gusta que le digan, su número de WhatsApp,
          su zona horaria, y los datos que nos das para que las preguntas le suenen a él (dónde
          y cuándo nació, a qué se dedicó, quién es quién en su familia). Y lo importante: los{" "}
          <F>audios</F> que graba, las <F>transcripciones</F> que hacemos de ellos, los{" "}
          <F>textos</F> del libro y las <F>fotos</F> que sube la familia.
        </Parrafo>
        <Parrafo>
          <F>Su voz</F>: si compras el audiolibro con su voz, usamos sus audios para crear una
          voz sintética que narre su libro. Esa voz es un <F>dato biométrico</F>: solo la
          creamos con el consentimiento explícito del narrador, pedido por WhatsApp para ese fin
          concreto, y la usamos únicamente para narrar su libro.
        </Parrafo>
        <Parrafo>
          <F>De los invitados</F>: su correo (para invitarlos), su nombre si entran, y las fotos
          que suben.
        </Parrafo>
        <Parrafo>
          <F>De quien visita</F>: nada que lo identifique. Solo los registros técnicos del
          servidor y las cookies de la sección 12.
        </Parrafo>
      </Seccion>

      <Seccion id="para-que" titulo="4. Para qué los usamos, y con qué derecho">
        <Lista
          items={[
            <>
              <F>Para hacer tu libro</F>: entrevistar, transcribir, escribir, narrar, maquetar,
              imprimir y mostrarte el resultado. Es el contrato que aceptaste al comprar.
            </>,
            <>
              <F>Para hablar con el narrador por WhatsApp</F>, hacerle las preguntas y guardar
              sus respuestas: con su consentimiento, que le pedimos antes de la primera pregunta
              y que puede retirar cuando quiera.
            </>,
            <>
              <F>Para crear su voz sintética</F>: solo con su consentimiento explícito y para ese
              fin.
            </>,
            <>
              <F>Para avisarte</F> por correo cómo va (cuando acepta, cuando responde la primera,
              a mitad de camino, si se queda en silencio, cuando el libro está listo). Es parte
              del servicio.
            </>,
            <>
              <F>Para facturar y cumplir la ley</F>: guardar los datos de la compra el tiempo que
              exige la normativa fiscal.
            </>,
            <>
              <F>Para que la web funcione y sea segura</F>: registros técnicos y cookies de
              sesión, por interés legítimo en que nadie entre a una cuenta ajena.
            </>,
          ]}
        />
        <Parrafo>
          Nada más. No usamos tus datos ni los de tu familia para publicidad, no los vendemos,
          no los cedemos a nadie que no necesite tocarlos para hacer tu libro, y no entrenamos
          ningún modelo de inteligencia artificial con ellos.
        </Parrafo>
      </Seccion>

      <Seccion id="quien-procesa" titulo="5. Quién procesa los datos por nosotros">
        <Parrafo>
          Para hacer el libro nos apoyamos en estos servicios. Cada uno ve solo lo que necesita
          para su parte, con un contrato que le prohíbe usarlo para otra cosa:
        </Parrafo>
        <Tabla
          columnas={["Quién", "Para qué", "Dónde"]}
          filas={[
            ["Supabase", "La base de datos y el almacén de audios, fotos, libros y audiolibros. También el acceso a tu cuenta.", "Unión Europea"],
            ["Vercel", "Aloja la web que estás leyendo y tu panel.", "Estados Unidos (red global)"],
            ["Railway", "Corre el entrevistador (el que manda y recibe los WhatsApp) y la fábrica que produce el libro y el audiolibro.", "Estados Unidos"],
            ["Meta (WhatsApp Business)", "Lleva y trae los mensajes y audios entre el narrador y nosotros. Meta ve los mensajes como los vería en cualquier chat de WhatsApp Business.", "Según las reglas de Meta"],
            ["OpenAI", "Transcribe los audios a texto, y pone la voz del narrador sintético cuando eliges esa opción. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
            ["Anthropic", "Redacta los capítulos a partir de las transcripciones, con las palabras del narrador. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
            ["Proveedor de clonación de voz", "Solo si compras el audiolibro con su voz: crea la voz sintética a partir de sus audios. Cuando lo elijamos, lo nombramos aquí antes de usarlo.", "A confirmar"],
            ["Stripe / Mercado Pago", "Cobran. Son los únicos que ven tu tarjeta.", "Stripe: UE y EE. UU. · Mercado Pago: Argentina"],
            ["Resend", "Manda los correos: el código para entrar, los avisos, el anticipo.", "Brasil (región de América del Sur)"],
            ["Imprenta y mensajería", "Solo si compras el libro impreso o los marcos: reciben el archivo, tu nombre y la dirección de envío.", "En tu país; te decimos cuál antes de mandar a producir"],
          ]}
        />
      </Seccion>

      <Seccion id="transferencias" titulo="6. Datos que salen de tu país">
        <Parrafo>
          Como ves en la tabla, algunos de esos servicios están en Estados Unidos. Si estás en
          la Unión Europea, esas transferencias se hacen bajo el Marco de Privacidad de Datos
          UE-EE. UU. o con las cláusulas contractuales tipo aprobadas por la Comisión Europea,
          según el proveedor. Argentina tiene decisión de adecuación de la Unión Europea, así que
          los datos pueden circular entre los dos países sin garantías adicionales. Si quieres
          ver los contratos con un proveedor concreto, pídelos por correo.
        </Parrafo>
      </Seccion>

      <Seccion id="cuanto-tiempo" titulo="7. Cuánto tiempo los guardamos">
        <Lista
          items={[
            <>
              <F>El libro, el audiolibro, las fotos y los audios</F>: mientras el libro esté en
              tu cuenta. Están ahí para que la familia vuelva a ellos cuando quiera.
            </>,
            <>
              <F>Los audios originales y la voz sintética</F>: además, se borran en cuanto tú o
              el narrador lo pidan, aunque el libro siga en tu cuenta.
            </>,
            <>
              <F>Tu cuenta</F>: hasta que pidas cerrarla. Si la cierras, borramos todo lo de
              arriba.
            </>,
            <>
              <F>Los datos de la compra</F> (qué, cuándo, cuánto, a nombre de quién): el tiempo
              que exige la ley fiscal de cada país, aunque cierres la cuenta.
            </>,
            <>
              <F>Los registros técnicos</F>: unos meses, solo para seguridad.
            </>,
          ]}
        />
      </Seccion>

      <Seccion id="con-quien" titulo="8. Con quién compartimos">
        <Parrafo>
          Con nadie, salvo los proveedores de la sección 5 y la familia que tú elijas: los
          invitados ven el libro y las fotos, y quien abra un enlace de muestra que tú
          compartiste ve la portada, los títulos de los capítulos, el primer párrafo y un
          minuto de audio. Nunca vendemos datos, nunca los usamos para publicidad y nunca los
          entregamos a terceros salvo obligación legal.
        </Parrafo>
      </Seccion>

      <Seccion id="derechos" titulo="9. Tus derechos (y los del narrador)">
        <Parrafo>
          Tú, el narrador y cada invitado pueden pedir en cualquier momento: <F>acceder</F> a
          sus datos, <F>corregirlos</F>, <F>borrarlos</F>, <F>llevárselos</F> en un formato
          usable (el libro en PDF, el audiolibro y los audios originales), <F>oponerse</F> a
          un uso o pedir que lo <F>limitemos</F>, y <F>retirar un consentimiento</F> (por
          ejemplo, el de la voz sintética) sin que eso afecte lo hecho hasta entonces.
        </Parrafo>
        <Parrafo>
          Cómo: un correo a <Correo cual="hola" /> desde la dirección de tu cuenta (o, si eres
          el narrador, un mensaje por el mismo WhatsApp). Contestamos en un mes como máximo;
          casi siempre en días. Si crees que no te hicimos caso, puedes reclamar ante la{" "}
          <Enlace href={es.autoridad.url}>{es.autoridad.nombre}</Enlace> si estás en España o
          ante la <Enlace href={ar.autoridad.url}>{ar.autoridad.nombre}</Enlace> si estás en
          Argentina.
        </Parrafo>
      </Seccion>

      <Seccion id="menores" titulo="10. Menores">
        <Parrafo>
          Para comprar hay que ser mayor de edad. El narrador da su propio permiso por
          WhatsApp; si el narrador fuera menor de edad, el permiso tiene que darlo quien ejerza
          su patria potestad, y te pedimos que nos lo digas al anotarlo.
        </Parrafo>
      </Seccion>

      <Seccion id="seguridad" titulo="11. Cómo los cuidamos">
        <Parrafo>
          Los audios, las fotos y los libros están en un almacén privado: no tienen enlaces
          públicos, y cada archivo se entrega solo a quien tiene derecho a verlo, con un enlace
          que caduca. A tu cuenta se entra con un código de un solo uso que te mandamos por
          correo; no hay contraseñas que se puedan filtrar. Las conexiones van cifradas. El
          acceso de los socios a los datos está limitado a lo necesario para producir tu libro
          y resolver problemas.
        </Parrafo>
      </Seccion>

      <Seccion id="cookies" titulo="12. Cookies">
        <Parrafo>
          Usamos solo cookies técnicas, las imprescindibles para que la web funcione: la que
          mantiene tu sesión abierta cuando entras a tu cuenta y la que recuerda si prefieres
          el panel en claro o en oscuro. No usamos cookies de publicidad ni de analítica, y por
          eso no te mostramos ningún aviso. Si algún día sumamos una herramienta de medición,
          te pediremos consentimiento antes de activarla y esta sección cambiará.
        </Parrafo>
      </Seccion>

      <Seccion id="ia" titulo="13. Inteligencia artificial">
        <Parrafo>
          Usamos modelos de inteligencia artificial para tres cosas: transcribir los audios,
          redactar los capítulos con las palabras del narrador, y —si lo eliges— narrar el
          audiolibro. Los modelos son de OpenAI y Anthropic, contratados por API, y ninguno usa
          lo que les mandamos para entrenar. Nosotros tampoco entrenamos nada con tu familia.
          Las decisiones que importan las toma una persona: tú apruebas el libro antes de que
          se cierre, y no hay ninguna decisión automatizada que te afecte legalmente.
        </Parrafo>
      </Seccion>

      <Seccion id="cambios" titulo="14. Si esto cambia">
        <Parrafo>
          Si cambiamos esta política de forma que te afecte —un proveedor nuevo, un uso nuevo—
          te avisamos por correo antes, y si el cambio necesita tu consentimiento, te lo
          pedimos. La fecha de arriba dice cuándo fue la última vez que la tocamos.
        </Parrafo>
      </Seccion>

      <Seccion id="contacto" titulo="15. Contacto">
        <Parrafo>
          <Correo cual="hola" /> para todo lo que tenga que ver con tus datos, los del narrador
          o los de un invitado. Te contesta una de las dos personas de la sección 1, no un
          sistema.
        </Parrafo>
      </Seccion>
    </Pagina>
  );
}
