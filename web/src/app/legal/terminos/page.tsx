import Link from "next/link";

// Términos del servicio. Requisito duro de la API de WhatsApp (Meta revisa el
// sitio antes de aprobar el negocio) y obligación legal para vender online en
// los dos mercados.
//
// ⚠️ BORRADOR PARA REVISAR CON UN GESTOR antes del primer cobro real. Los
// bloques marcados [PENDIENTE] necesitan datos que solo tienen los socios: la
// identidad fiscal de quien presta el servicio es obligatoria en España
// (LSSI-CE, art. 10) y en Argentina.
//
// Está escrito en el mismo tono que /legal/privacidad: llano, en "tú", sin
// jerga. Un texto legal que la clienta no entiende no la protege ni nos
// protege.

const ACTUALIZADO = "11 de septiembre de 2026";

export default function Terminos() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">Términos del servicio</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Qué te damos, qué te cobramos y cuándo. En castellano, sin letra chica.
        </p>
        <p className="mt-1 text-xs text-zinc-500">Última actualización: {ACTUALIZADO}</p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="text-base font-medium text-zinc-900">Quiénes somos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Vitácora Familiar es un servicio prestado por{" "}
              <span className="bg-amber-100 px-1">
                [PENDIENTE: nombre completo o razón social, identificación fiscal y domicilio]
              </span>
              . Puedes escribirnos a{" "}
              <a
                href="mailto:hola@vitacorafamiliar.com"
                className="underline decoration-zinc-300 underline-offset-2"
              >
                hola@vitacorafamiliar.com
              </a>{" "}
              y te contestamos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Qué hacemos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Entrevistamos por WhatsApp a la persona que nos indicas, una pregunta por día
              durante 30 días, y con sus respuestas escribimos el libro de su vida. Te lo
              entregamos en PDF y como audiolibro con su propia voz.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              El libro impreso en papel es un producto aparte: no está incluido en el precio y
              se pide por separado cuando el libro está terminado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Nada empieza sin su permiso</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Al anotar a alguien nos confirmas que puedes hacerlo y que le va a parecer bien.
              Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó
              y le pedimos permiso. <strong className="font-medium">Si no acepta, no empieza
              nada y no se te cobra.</strong> Puede parar cuando quiera, retomar cuando quiera,
              y pedir que borremos todo lo que grabó.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Cuándo se paga</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Anotar a alguien es gratis y no te pedimos ninguna tarjeta para empezar.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Cuando tu narrador responde su tercera pregunta te avisamos por correo y te
              mostramos las primeras páginas de su libro y un fragmento de su voz.{" "}
              <strong className="font-medium">Recién ahí decides si quieres el libro completo,
              y solo entonces se paga.</strong> Es un pago único: no hay suscripción, no hay
              renovación automática y no hay nada que cancelar si decides que no.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              El precio aparece siempre antes de pagar. Si no lo compras, la entrevista se
              detiene y no se te cobra nada.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Si te arrepientes</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Puedes arrepentirte de la compra y pedir la devolución del dinero dentro de los{" "}
              <strong className="font-medium">10 días corridos</strong> siguientes al pago,
              escribiendo a{" "}
              <a
                href="mailto:hola@vitacorafamiliar.com"
                className="underline decoration-zinc-300 underline-offset-2"
              >
                hola@vitacorafamiliar.com
              </a>
              . No hace falta que expliques por qué. Te devolvemos el importe completo por el
              mismo medio con el que pagaste.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Si compras desde España, tienes además el derecho de desistimiento de 14 días que
              te da la ley.{" "}
              <span className="bg-amber-100 px-1">
                [PENDIENTE: revisar con gestor cómo se aplica el desistimiento a un contenido
                digital ya entregado, y si conviene pedir consentimiento expreso a la entrega]
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">La historia es de tu familia</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Lo que cuenta tu narrador es suyo y de tu familia. Nosotros no nos quedamos con
              ningún derecho sobre su historia, ni la publicamos, ni la usamos como ejemplo, ni
              se la mostramos a nadie. Si algún día quisiéramos mostrar una página como muestra
              de nuestro trabajo, te lo pediríamos por escrito y podrías decir que no.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Qué te prometemos y qué no</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Te prometemos que el libro se escribe con las palabras de tu narrador, que para él
              va a ser fácil —un audio de WhatsApp por día, sin instalar nada— y que si algo
              sale mal lo arreglamos o te devolvemos el dinero.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              No podemos prometerte cuánto va a querer contar, ni cuántas preguntas va a
              responder. Si contesta pocas, el libro sale más corto: preferimos un libro breve y
              verdadero antes que uno largo y relleno. Si responde menos de diez preguntas y por
              eso no hay libro, no se te cobra.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Tus datos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Qué guardamos, para qué y cómo borrarlo está en la{" "}
              <Link
                href="/legal/privacidad"
                className="underline decoration-zinc-300 underline-offset-2"
              >
                política de privacidad
              </Link>
              . Lo resumido: los audios son de tu familia, se usan solo para su libro y se
              borran cuando lo pidas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Si algo cambia</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los
              cambios nunca se aplican hacia atrás sobre un libro ya pagado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Ley aplicable</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              <span className="bg-amber-100 px-1">
                [PENDIENTE: definir con gestor la ley y jurisdicción según dónde quede
                constituido el servicio y desde dónde compra cada cliente. Los consumidores
                conservan siempre los derechos de su país de residencia.]
              </span>
            </p>
          </section>
        </div>

        <p className="mt-12 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500">
          ¿Quieres darte de baja o pedir la devolución? Escribe a{" "}
          <a
            href="mailto:hola@vitacorafamiliar.com"
            className="underline decoration-zinc-300 underline-offset-2"
          >
            hola@vitacorafamiliar.com
          </a>{" "}
          y te respondemos. También puedes pedirnos que borremos todo lo grabado.
        </p>
      </div>
    </div>
  );
}
