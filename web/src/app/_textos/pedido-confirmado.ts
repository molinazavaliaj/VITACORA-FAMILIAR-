import type { Textos } from "@/lib/idioma-web";

// «Pedido confirmado» (paso 4 de la maqueta Checkout): /comprar/gracias, adonde
// vuelve la pasarela después de cobrar. Lista de qué pasa ahora sin promesas
// que el sistema no cumple (DECISIONES D4): sin anticipo, sin «9 días», sin
// «lo lees mientras se escribe». Lo aprobado el 06/10 (G1, G2, #18, #19) va tal
// cual; lo nuevo está en docs/rediseno-2026-10/fase-1/textos-checkout.md.
// ca: PENDIENTE REVISIÓN NATIVA (el bloque ca).

export type Momento = { cuando: string; que: string };

export type TextosConfirmado = {
  tituloPagina: string;
  antetitulo: string;
  tituloDe: (nombre: string) => string;
  tituloPropio: string;
  tituloGenerico: string;
  correo: string;
  correoRegalo: string;
  /** Lo que pasa ahora, por caso. `impreso` suma la línea de la imprenta. */
  otro: (nombre: string, impreso: boolean) => Momento[];
  regalo: (nombre: string, impreso: boolean) => Momento[];
  propio: (impreso: boolean) => Momento[];
  generico: Momento[];
  viaje: (numero: string | null) => string;
  /** El botón a la página de su historia (o la de tu historia, si el libro es propio). */
  irAlPanel: (propia: boolean) => string;
  entrarAlPanel: string;
  sinContrasenas: string;
  descargarTarjeta: string;
  direccionGuardada: string;
  faltaDireccion: string;
  ponerDireccion: (propia: boolean) => string;
};

export const CONFIRMADO: Textos<TextosConfirmado> = {
  es: {
    tituloPagina: "Pedido confirmado",
    antetitulo: "Pedido confirmado",
    tituloDe: (n) => `Ya está. El libro de ${n} está en marcha.`,
    tituloPropio: "Ya está. Tu libro está en marcha.",
    tituloGenerico: "Gracias. Ya está en marcha.",
    correo: "Te mandamos un correo con todo esto y con cómo entrar a la página de su historia, donde vas a ir escuchando lo que cuenta. Si no lo ves, mira en promociones o en spam.",
    correoRegalo: "Te mandamos la tarjeta por correo. Si no la ves, mira en promociones o en spam.",
    otro: (n, impreso) => [
      { cuando: "Hoy", que: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. Arranca cuando quiera." },
      { cuando: "Antes", que: `Avisa a ${n} de que le va a escribir «Vitácora» por WhatsApp.` },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
      { cuando: "Al terminar", que: `Cuando termina de contar, el biógrafo escribe su libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    regalo: (n, impreso) => [
      { cuando: "Hoy", que: "Imprime la tarjeta o mándala por WhatsApp, y guárdala hasta el día del regalo." },
      { cuando: "Ese día", que: `Cuando ${n} la escanee, empieza su entrevista por WhatsApp.` },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
      { cuando: "Al terminar", que: `Cuando termina de contar, el biógrafo escribe su libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    propio: (impreso) => [
      { cuando: "Hoy", que: "Guarda el contacto «Vitácora» en tu móvil. Te escribimos desde ahí." },
      { cuando: "Mientras cuentas", que: "Desde tu primera respuesta, en la página de tu historia aparecen tus audios." },
      { cuando: "Al terminar", que: `Cuando terminas de contar, el biógrafo escribe tu libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    generico: [
      { cuando: "Hoy", que: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. Arranca cuando quiera." },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
    ],
    viaje: (numero) =>
      numero
        ? `Vuestro biógrafo de viaje se presenta por WhatsApp. Para empezar ya, mandadle un «hola» a ${numero}: os contesta y os pide el SÍ.`
        : "Vuestro biógrafo de viaje se presenta por WhatsApp. Cuando os escriba, responded SÍ y empieza.",
    irAlPanel: (propia) => (propia ? "Ir a la página de tu historia" : "Ir a la página de su historia"),
    entrarAlPanel: "Entrar a mi panel",
    sinContrasenas: "Con tu correo y un código de 6 números. Sin contraseñas.",
    descargarTarjeta: "Descargar la tarjeta de regalo",
    direccionGuardada: "Dirección de envío guardada.",
    faltaDireccion: "Falta la dirección de envío del libro impreso.",
    ponerDireccion: (propia) => `Ponla desde la página de ${propia ? "tu" : "su"} historia`,
  },
  ar: {
    tituloPagina: "Pedido confirmado",
    antetitulo: "Pedido confirmado",
    tituloDe: (n) => `Listo. El libro de ${n} está en marcha.`,
    tituloPropio: "Listo. Tu libro está en marcha.",
    tituloGenerico: "Gracias. Ya está en marcha.",
    correo: "Te mandamos un correo con todo esto y con cómo entrar a la página de su historia, donde vas a ir escuchando lo que cuenta. Si no lo ves, mirá en promociones o en spam.",
    correoRegalo: "Te mandamos la tarjeta por mail. Si no la ves, mirá en promociones o en spam.",
    otro: (n, impreso) => [
      { cuando: "Hoy", que: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. Arranca cuando quiera." },
      { cuando: "Antes", que: `Avisale a ${n} que le va a escribir «Vitácora» por WhatsApp.` },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
      { cuando: "Al terminar", que: `Cuando termina de contar, el biógrafo escribe su libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    regalo: (n, impreso) => [
      { cuando: "Hoy", que: "Imprimí la tarjeta o mandala por WhatsApp, y guardala hasta el día del regalo." },
      { cuando: "Ese día", que: `Cuando ${n} la escanee, empieza su entrevista por WhatsApp.` },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
      { cuando: "Al terminar", que: `Cuando termina de contar, el biógrafo escribe su libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    propio: (impreso) => [
      { cuando: "Hoy", que: "Guardá el contacto «Vitácora» en tu celular. Te escribimos desde ahí." },
      { cuando: "Mientras contás", que: "Desde tu primera respuesta, en la página de tu historia aparecen tus audios." },
      { cuando: "Al terminar", que: `Cuando terminás de contar, el biógrafo escribe tu libro.${impreso ? " Te avisamos cuando salga de imprenta y te mandamos el seguimiento." : ""}` },
    ],
    generico: [
      { cuando: "Hoy", que: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. Arranca cuando quiera." },
      { cuando: "Mientras cuenta", que: "Desde la primera respuesta, en la página de su historia aparecen sus audios, uno por uno, con su voz y sus modos de decir." },
    ],
    // El texto de vos es el de antes, letra por letra.
    viaje: (numero) =>
      numero
        ? `Tu biógrafo de viaje se presenta por WhatsApp. Para arrancar ya, mandale un hola a ${numero}: te contesta y te pide el SÍ.`
        : "Tu biógrafo de viaje se presenta por WhatsApp. Cuando te escriba, respondé SÍ y esa noche llega la primera pregunta.",
    irAlPanel: (propia) => (propia ? "Ir a la página de tu historia" : "Ir a la página de su historia"),
    entrarAlPanel: "Entrar a mi panel",
    sinContrasenas: "Con tu correo y un código de 6 números. Sin contraseñas.",
    descargarTarjeta: "Descargar la tarjeta de regalo",
    direccionGuardada: "Dirección de envío guardada.",
    faltaDireccion: "Falta la dirección de envío del libro impreso.",
    ponerDireccion: (propia) => `Cargala desde la página de ${propia ? "tu" : "su"} historia`,
  },
  ca: {
    tituloPagina: "Comanda confirmada",
    antetitulo: "Comanda confirmada",
    tituloDe: (n) => `Ja està. El llibre de ${n} està en marxa.`,
    tituloPropio: "Ja està. El teu llibre està en marxa.",
    tituloGenerico: "Gràcies. Ja està en marxa.",
    correo: "T'enviem un correu amb tot això i amb com entrar a la pàgina de la seva història, on aniràs escoltant el que explica. Si no el veus, mira a promocions o a correu brossa.",
    correoRegalo: "T'enviem la targeta per correu. Si no la veus, mira a promocions o a correu brossa.",
    otro: (n, impreso) => [
      { cuando: "Avui", que: "D'aquí a una estona li arriba un missatge nostre per WhatsApp, explicant-li de què es tracta. Comença quan vulgui." },
      { cuando: "Abans", que: `Avisa ${n} que li escriurà «Vitácora» per WhatsApp.` },
      { cuando: "Mentre explica", que: "Des de la primera resposta, a la pàgina de la seva història apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses." },
      { cuando: "En acabar", que: `Quan acaba d'explicar, el biògraf escriu el seu llibre.${impreso ? " T'avisem quan surti d'impremta i t'enviem el seguiment." : ""}` },
    ],
    regalo: (n, impreso) => [
      { cuando: "Avui", que: "Imprimeix la targeta o envia-la per WhatsApp, i guarda-la fins al dia del regal." },
      { cuando: "Aquell dia", que: `Quan ${n} l'escanegi, comença la seva entrevista per WhatsApp.` },
      { cuando: "Mentre explica", que: "Des de la primera resposta, a la pàgina de la seva història apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses." },
      { cuando: "En acabar", que: `Quan acaba d'explicar, el biògraf escriu el seu llibre.${impreso ? " T'avisem quan surti d'impremta i t'enviem el seguiment." : ""}` },
    ],
    propio: (impreso) => [
      { cuando: "Avui", que: "Desa el contacte «Vitácora» al teu mòbil. T'escrivim des d'allà." },
      { cuando: "Mentre expliques", que: "Des de la teva primera resposta, a la pàgina de la teva història apareixen els teus àudios." },
      { cuando: "En acabar", que: `Quan acabes d'explicar, el biògraf escriu el teu llibre.${impreso ? " T'avisem quan surti d'impremta i t'enviem el seguiment." : ""}` },
    ],
    generico: [
      { cuando: "Avui", que: "D'aquí a una estona li arriba un missatge nostre per WhatsApp, explicant-li de què es tracta. Comença quan vulgui." },
      { cuando: "Mentre explica", que: "Des de la primera resposta, a la pàgina de la seva història apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses." },
    ],
    viaje: (numero) =>
      numero
        ? `El vostre biògraf de viatge es presenta per WhatsApp. Per començar ja, envieu-li un «hola» a ${numero}: us contesta i us demana el SÍ.`
        : "El vostre biògraf de viatge es presenta per WhatsApp. Quan us escrigui, responeu SÍ i comença.",
    irAlPanel: (propia) => (propia ? "Anar a la pàgina de la teva història" : "Anar a la pàgina de la seva història"),
    entrarAlPanel: "Entrar al meu panell",
    sinContrasenas: "Amb el teu correu i un codi de 6 xifres. Sense contrasenyes.",
    descargarTarjeta: "Descarregar la targeta de regal",
    direccionGuardada: "Adreça d'enviament desada.",
    faltaDireccion: "Falta l'adreça d'enviament del llibre imprès.",
    ponerDireccion: (propia) => `Posa-la des de la pàgina de la ${propia ? "teva" : "seva"} història`,
  },
};
