import { TITULARES } from "../titulares";
import { Correo, DatosTitular, Enlace, Lista, Pagina, Parrafo, Seccion } from "../ui";

// Términos del servicio. Requisito duro de la API de WhatsApp (Meta revisa el
// sitio antes de aprobar el negocio) y obligación legal para vender online en
// los dos mercados.
//
// Dos titulares, uno por mercado (ver ../titulares.ts): el contrato es con el
// de la región que el cliente eligió en el checkout. La política de
// devolución es el mínimo legal de cada país (decisión de Naza, 16/09/2026):
// España 14 días naturales con descuento de lo ya prestado; Argentina 10 días
// corridos sin costo y botón de arrepentimiento.
//
// Escrito llano y en "tú", como /legal/privacidad. Un texto legal que la
// clienta no entiende no la protege ni nos protege.

export const metadata = {
  title: "Términos del servicio",
  description: "Qué te damos, qué te cobramos, cuándo puedes arrepentirte y de quién es la historia.",
};

export default function Terminos() {
  const es = TITULARES.ES;
  const ar = TITULARES.AR;

  return (
    <Pagina titulo="Términos del servicio" bajada="Qué te damos, qué te cobramos y cuándo. En castellano, sin letra chica.">
      <Seccion id="quienes-somos" titulo="1. Quiénes somos">
        <Parrafo>
          Vitácora Familiar lo prestan dos personas, una en cada país donde vendemos. Con quién
          contratas depende de la región que eliges al comprar (la misma que decide la moneda y
          el medio de pago):
        </Parrafo>
        <Lista
          items={[
            <>
              Si compras desde <strong className="font-medium">España</strong> (en euros): <DatosTitular titular={es} />.
            </>,
            <>
              Si compras desde <strong className="font-medium">Argentina</strong> (en pesos): <DatosTitular titular={ar} />.
            </>,
          ]}
        />
        <Parrafo>
          En estos términos, «nosotros» es el titular que te corresponde. Para cualquier cosa
          escribe a <Correo cual="hola" /> (o a <Correo cual="soporte" /> si es un problema con
          la web) y te contestamos.
        </Parrafo>
      </Seccion>

      <Seccion id="que-es" titulo="2. Qué es el servicio">
        <Parrafo>
          Entrevistamos por WhatsApp a la persona que nos indicas (el «narrador»): una pregunta
          por día durante unos treinta días, que responde con un audio, sin instalar nada. Con
          sus respuestas escribimos el libro de su vida, en primera persona y con sus propias
          palabras.
        </Parrafo>
        <Parrafo>Lo que puedes comprar:</Parrafo>
        <Lista
          items={[
            <>
              <strong className="font-medium">El libro en PDF</strong>: se lee en la web, capítulo por capítulo, con las fotos que
              suba la familia. Incluye <strong className="font-medium">«Su voz»</strong>: sus mejores frases, recortadas de sus
              audios originales tal como las dijo, para escuchar en la web y con un código impreso. Está siempre disponible
              en tu cuenta.
            </>,
            <>
              <strong className="font-medium">El libro impreso</strong>, en blanco y negro o a color: tapa dura, con un código en
              la contratapa que hace sonar su voz.
            </>,
            <>
              <strong className="font-medium">Marcos con su voz</strong>: un marco con su foto y un chip; se acerca el teléfono y
              suena su voz.
            </>,
          ]}
        />
        <Parrafo>
          Hace falta comprar al menos uno de los tres primeros; los marcos se suman a
          cualquiera. Solo se ofrece lo que tiene precio publicado en tu región.
        </Parrafo>
        <Parrafo>
          Desde tu cuenta puedes invitar a familiares para que lean el libro y suban fotos, y
          compartir una muestra pública (portada, títulos de los capítulos, el primer párrafo y
          un minuto de audio). La muestra solo existe si tú compartes el enlace.
        </Parrafo>
      </Seccion>

      <Seccion id="compra" titulo="3. Cómo se compra">
        <Parrafo>
          Es un <strong className="font-medium">pago único, por adelantado</strong>. No hay
          suscripción, no hay renovación automática y no guardamos tu tarjeta: el cobro lo hace
          Stripe (España) o Mercado Pago (Argentina) y ellos son los únicos que ven tus datos de
          pago.
        </Parrafo>
        <Parrafo>
          El precio de cada producto aparece antes de pagar, en euros o en pesos según la región
          que elijas, y es el precio final que pagas. Después del pago te llega un correo para entrar
          a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su
          WhatsApp y unos pocos datos para que las preguntas le suenen a él.
        </Parrafo>
      </Seccion>

      <Seccion id="permiso" titulo="4. Nada empieza sin su permiso">
        <Parrafo>
          Al anotar a alguien nos confirmas que puedes hacerlo y que le va a parecer bien.
          Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y
          le pedimos permiso. <strong className="font-medium">Si no acepta, no empieza nada y te
          devolvemos el dinero completo</strong> (ver la sección 7).
        </Parrafo>
        <Parrafo>
          El narrador manda en su historia: puede parar cuando quiera, retomar cuando quiera,
          responder solo lo que quiera, y pedir que borremos todo lo que grabó. Si deja de responder
          unos días, te avisamos por correo.
        </Parrafo>
      </Seccion>

      <Seccion id="entrega" titulo="5. Qué te entregamos y cuándo">
        <Parrafo>
          El ritmo lo pone el narrador: la entrevista dura lo que él tarde en responder, y
          puedes seguirla desde tu cuenta mientras avanza. Cuando termina, producimos el libro
          y te avisamos por correo. Antes de darlo por cerrado lo revisas tú: puedes cambiar el
          título, el orden y los nombres de los capítulos, las fotos de la portada y la
          contratapa, dejar fuera alguna respuesta y pedir correcciones de lo que no suene a él.
        </Parrafo>
        <Parrafo>
          El libro en PDF y sus frases en su voz quedan disponibles en tu cuenta. El libro impreso y
          los marcos se producen después de que apruebas el libro; antes de mandarlos a
          producir te escribimos para pedirte la dirección de envío y confirmarte el plazo.
        </Parrafo>
      </Seccion>

      <Seccion id="arrepentimiento" titulo="6. Si te arrepientes">
        <Parrafo>
          Puedes arrepentirte de la compra sin dar explicaciones. Escríbenos a{" "}
          <Correo cual="hola" /> o usa el{" "}
          <Enlace href="/legal/arrepentimiento">botón de arrepentimiento</Enlace>; te
          confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el
          mismo medio con el que pagaste, en un plazo máximo de 14 días. El plazo para
          arrepentirte depende de dónde compraste:
        </Parrafo>
        <Lista
          items={[
            <>
              <strong className="font-medium">España — 14 días naturales</strong> desde la compra
              (derecho de desistimiento, arts. 102 a 108 del RDL 1/2007). Al pagar nos pides que la
              entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; si te
              arrepientes con la entrevista ya en marcha, te devolvemos el precio menos la parte proporcional a
              las preguntas ya hechas (art. 108.3). Una vez que el libro en PDF y sus frases en su voz
              están a tu disposición en tu cuenta, con tu consentimiento, el desistimiento ya no
              aplica sobre ellos (art. 103 m); tampoco sobre el libro impreso ni los marcos, que
              se hacen a medida (art. 103 c). Si algo llega dañado o con un defecto, lo reponemos.
            </>,
            <>
              <strong className="font-medium">Argentina — 10 días corridos</strong> desde la
              compra (art. 34 de la ley 24.240). Puedes revocar la compra sin costo alguno y te
              devolvemos el total. El botón de arrepentimiento está en la página de inicio, como
              exige la Resolución 424/2020.
            </>,
          ]}
        />
        <Parrafo>
          Estos plazos son los que marca la ley de cada país; nunca te van a dar menos derechos
          que los que te corresponden como consumidor donde vives.
        </Parrafo>
      </Seccion>

      <Seccion id="sin-libro" titulo="7. Si no hay libro">
        <Parrafo>
          Si el narrador no acepta participar, o responde menos de diez preguntas y por eso no
          hay material para un libro, te devolvemos el importe completo, sin plazo y sin
          descuento: no te entregamos lo que compraste, así que no te lo cobramos. Preferimos un
          libro breve y verdadero antes que uno largo y relleno, pero por debajo de diez
          respuestas no hay libro.
        </Parrafo>
      </Seccion>

      <Seccion id="historia" titulo="8. La historia es de tu familia">
        <Parrafo>
          Lo que cuenta tu narrador es suyo y de tu familia. No nos quedamos con ningún derecho
          sobre su historia, sus audios, sus fotos ni su voz: nos das únicamente el permiso
          necesario para transcribir, escribir, maquetar, narrar e imprimir tu libro. Nunca
          publicamos su historia, nunca la usamos como ejemplo y nunca se la mostramos a nadie
          fuera de tu familia. Si algún día quisiéramos mostrar una página como muestra de
          nuestro trabajo, te lo pediríamos por escrito y podrías decir que no.
        </Parrafo>
        <Parrafo>
          Sus frases en su voz son recortes de sus propios audios, sin ninguna voz sintética.
          No se usan para ningún otro fin y se borran cuando el narrador o tú lo pidan.
        </Parrafo>
      </Seccion>

      <Seccion id="uso" titulo="9. Lo que te pedimos a ti">
        <Lista
          items={[
            <>Anota solo a alguien a quien puedas anotar y que vaya a estar de acuerdo. El servicio no sirve para grabar, vigilar ni acosar a nadie.</>,
            <>Las fotos y los nombres que subas tú o tus invitados son responsabilidad de quien los sube: no subas material de otras personas sin su permiso.</>,
            <>Tu cuenta es tuya: el código de acceso que te mandamos por correo no lo compartas. Si crees que alguien entró sin permiso, avísanos.</>,
          ]}
        />
      </Seccion>

      <Seccion id="promesas" titulo="10. Qué te prometemos y qué no">
        <Parrafo>
          Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va
          a ser fácil —un audio de WhatsApp por día— y que si algo sale mal lo arreglamos o te
          devolvemos el dinero.
        </Parrafo>
        <Parrafo>
          Para transcribir los audios y para redactar los capítulos usamos inteligencia
          artificial, y puede equivocarse: un nombre mal oído, una fecha, un giro que no le
          pertenece. Por eso el libro no se cierra hasta que lo revisas tú, y por eso te
          pedimos que lo leas antes de aprobarlo. Lo que se imprime es lo que aprobaste.
        </Parrafo>
        <Parrafo>
          No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a
          responder. Si cuenta poco, el libro sale más corto.
        </Parrafo>
        <Parrafo>
          Si algo falla por nuestra culpa, respondemos hasta el importe que pagaste. Esto no
          limita ningún derecho que la ley de tu país no permita limitar, ni nuestra
          responsabilidad por dolo o por daños a las personas.
        </Parrafo>
      </Seccion>

      <Seccion id="datos" titulo="11. Tus datos">
        <Parrafo>
          Qué guardamos, quién lo procesa, por cuánto tiempo y cómo borrarlo está en la{" "}
          <Enlace href="/legal/privacidad">política de privacidad</Enlace>. Lo resumido: los
          audios y la voz son de tu familia, se usan solo para su libro, no se usan para
          entrenar ningún modelo y se borran cuando lo pidas.
        </Parrafo>
      </Seccion>

      <Seccion id="cambios" titulo="12. Si algo cambia">
        <Parrafo>
          Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los
          cambios nunca se aplican hacia atrás sobre un libro ya pagado: para ese libro valen
          los términos que aceptaste al comprar.
        </Parrafo>
      </Seccion>

      <Seccion id="ley" titulo="13. Ley y jurisdicción">
        <Lista
          items={[
            <>
              Si compras desde <strong className="font-medium">España</strong>, el contrato se rige por {es.ley}. Cualquier
              disputa se resuelve en los juzgados de tu domicilio. También puedes acudir a la
              oficina de consumo de tu comunidad autónoma o a una Junta Arbitral de Consumo;
              tienes hojas de reclamaciones a tu disposición pidiéndolas por correo.
            </>,
            <>
              Si compras desde <strong className="font-medium">Argentina</strong>, el contrato se rige por {ar.ley}. Puedes
              reclamar ante la autoridad de Defensa del Consumidor de tu jurisdicción o por la{" "}
              <Enlace href="https://www.argentina.gob.ar/produccion/defensadelconsumidor">ventanilla única federal</Enlace>.
            </>,
          ]}
        />
        <Parrafo>
          En los dos casos conservas siempre los derechos que te da la ley del país donde vives.
          Antes de cualquier reclamo formal, escríbenos: lo normal es que lo resolvamos en un
          correo.
        </Parrafo>
      </Seccion>

      <Seccion id="contacto" titulo="14. Contacto">
        <Parrafo>
          <Correo cual="hola" /> para todo lo que tenga que ver con tu libro, tu compra o una
          devolución. <Correo cual="soporte" /> si algo no funciona en la web. Contestamos en
          días hábiles.
        </Parrafo>
      </Seccion>
    </Pagina>
  );
}
