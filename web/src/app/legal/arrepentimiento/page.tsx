import { CONTACTO } from "../titulares";
import { Correo, Enlace, Lista, Pagina, Parrafo, Seccion } from "../ui";

// El "Botón de arrepentimiento" que exige la Resolución 424/2020 (Argentina):
// un enlace con esa leyenda, de acceso fácil desde la página de inicio, que
// permita revocar la compra sin trabas. Sirve igual para el desistimiento de
// España. Es un mailto con el asunto y el cuerpo prellenados: no hay
// formulario que fallar, y la respuesta (dentro de las 24 h) la da una
// persona por el mismo correo.

export const metadata = {
  title: "Botón de arrepentimiento",
  description: "Cómo arrepentirte de una compra y pedir la devolución.",
};

const ASUNTO = "Arrepentimiento de compra";
const CUERPO = [
  "Hola. Quiero arrepentirme de mi compra en Vitácora Familiar.",
  "",
  "Correo con el que compré: ",
  "Nombre del narrador: ",
  "Fecha de la compra (aproximada): ",
  "",
  "Gracias.",
].join("\n");

const MAILTO = `mailto:${CONTACTO.hola}?subject=${encodeURIComponent(ASUNTO)}&body=${encodeURIComponent(CUERPO)}`;

export default function Arrepentimiento() {
  return (
    <Pagina titulo="Botón de arrepentimiento" bajada="Si te arrepentiste de la compra, esto es todo lo que hay que hacer.">
      <Seccion titulo="Cómo se hace">
        <Parrafo>
          Aprieta el botón: se abre un correo a <Correo cual="hola" /> con el asunto ya
          escrito. Completa tu correo de compra y el nombre del narrador, y mándalo. No hace
          falta que expliques por qué.
        </Parrafo>
        <a
          href={MAILTO}
          className="inline-block rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Quiero arrepentirme de mi compra
        </a>
        <Parrafo>
          Si el botón no te abre el correo, escribe tú a <Correo cual="hola" /> con el asunto
          «{ASUNTO}».
        </Parrafo>
      </Seccion>

      <Seccion titulo="Qué pasa después">
        <Lista
          items={[
            <>Te confirmamos por correo que lo recibimos, dentro de las 24 horas.</>,
            <>Si la entrevista había empezado, la paramos y le avisamos al narrador con cuidado.</>,
            <>Te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días.</>,
          ]}
        />
      </Seccion>

      <Seccion titulo="Plazos">
        <Lista
          items={[
            <>
              <strong className="font-medium">Argentina</strong>: 10 días corridos desde la compra, sin costo (art. 34 de la ley 24.240).
            </>,
            <>
              <strong className="font-medium">España</strong>: 14 días naturales desde la compra. Si la entrevista ya empezó a tu pedido, se descuenta la parte ya hecha; el PDF (con sus frases en su voz) ya entregado y los productos a medida (impreso, marcos) no se pueden devolver.
            </>,
            <>
              <strong className="font-medium">Sin plazo</strong>: si el narrador no acepta participar o responde menos de diez preguntas, te devolvemos todo, siempre.
            </>,
          ]}
        />
        <Parrafo>
          El detalle está en la sección{" "}
          <Enlace href="/legal/terminos#arrepentimiento">«Si te arrepientes» de los términos</Enlace>.
        </Parrafo>
      </Seccion>
    </Pagina>
  );
}
