import type { Textos } from "@/lib/idioma-web";
import type { ClaveFallaKids, IdiomaKids, QuienRegala, TemaKids } from "@/lib/kids";

// La compra de Vitácora Kids (/comprar/kids, /ca/comprar/kids, /ar/comprar/kids).
//
// Las 3 pantallas son las APROBADAS por Naza el 05/10 en la rama vitacora-kids
// (docs/kids/v2/mensajes.md §8, COMPRA-1 a COMPRA-3; paso-3-ronda6-compra.md:
// «Aprobado por Naza (05/10): los textos de arriba, con los tres ✎»). Están
// en vos: /ar las usa TAL CUAL. España (tú) y catalán son adaptaciones, PARA
// APROBAR (docs/rediseno-2026-10/kids/textos.md). También para aprobar: lo que
// no estaba en la rama (los avisos de error, «Próximamente», el resumen).
//
// Desde el 16/10 (Naza, tanda 8) Kids se vende también en España: el motor
// habla es-ES y lo que se elige en «Quién se lo regala» se guarda en el
// castellano de la región («tu madre» en España, «tu mamá» en Argentina,
// lib/kids.ts). En catalán Kids no se vende (KIDS_IDIOMAS_WEB).
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosCheckoutKids = {
  tituloPagina: string;
  descripcion: string;
  pasos: [string, string, string];
  pasosEtiqueta: string;
  pasoDe: (n: number, total: number) => string;
  continuar: string;
  atras: string;
  // COMPRA-1 · Tú
  tuTitulo: string;
  tuBajada: string;
  tuNombre: string;
  tuNombrePista: string;
  tuWhatsapp: string;
  tuWhatsappPista: string;
  tuWhatsappAyuda: string;
  correo: string;
  correoPista: string;
  correoAyuda: string;
  // COMPRA-2 · Quién lo cuenta
  quienTitulo: string;
  quienBajada: string;
  suNombre: string;
  suNombrePista: string;
  suNombreAyuda: string;
  apodo: string;
  apodoPista: string;
  apodoAyuda: string;
  genero: string;
  generos: { chico: string; chica: string };
  generoAyuda: string;
  edad: string;
  edadPista: string;
  edadAyuda: string;
  regala: string;
  quienes: Record<QuienRegala, string>;
  regalaOtraPista: string;
  regalaAyuda: string;
  canal: string;
  canalA: { titulo: string; detalle: string };
  suWhatsapp: string;
  canalAutoriza: string;
  canalB: { titulo: string; detalle: string };
  hora: string;
  horaAyuda: string;
  // COMPRA-3 · Temas y pago
  temasTitulo: string;
  temasBajada: string;
  temasLeyenda: string;
  temas: Record<TemaKids, string>;
  temasDebajo: string;
  fotos: string;
  fotosAyuda: string;
  pagar: (precio: string) => string;
  procesando: string;
  despues: string;
  despuesTexto: string;
  legalAntes: string;
  terminos: string;
  legalDespues: string;
  // Mientras no se vende
  proximamente: string;
  proximamenteTexto: string;
  escribir: string;
  volver: string;
  // El resumen
  marca: string;
  libroDe: (nombre: string) => string;
  suLibro: string;
  resumen: string;
  total: string;
  pagoUnico: string;
  errores: Record<ClaveFallaKids, string>;
};

export const CHECKOUT_KIDS: Textos<TextosCheckoutKids> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    tituloPagina: "Vitácora Kids · Empezar su libro",
    descripcion: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    pasos: ["Tú", "Quién lo cuenta", "Temas y pago"],
    pasosEtiqueta: "Pasos de la compra",
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    tuTitulo: "El libro de su vida, contado con audios.",
    tuBajada: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad. Aquí van tus datos.",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellido",
    tuWhatsapp: "Tu WhatsApp",
    tuWhatsappPista: "612 34 56 78",
    tuWhatsappAyuda: "Aquí te avisamos si hace falta y cuando el libro esté listo.",
    correo: "Tu correo",
    correoPista: "tu@ejemplo.com",
    correoAyuda: "Con este entras a tu panel, donde ves todo lo que cuenta.",
    quienTitulo: "Quién lo cuenta.",
    quienBajada: "Lo que necesitamos para que las preguntas le hablen bien y la tapa sea suya.",
    suNombre: "Su nombre",
    suNombrePista: "Nombre y apellido",
    suNombreAyuda: "Así va en la tapa.",
    apodo: "Cómo le llamáis",
    apodoPista: "Como le llamáis en casa",
    apodoAyuda: "Así le saludamos en los mensajes.",
    genero: "Niño o niña",
    generos: { chico: "Niño", chica: "Niña" },
    generoAyuda: "Solo para que las preguntas le hablen bien.",
    edad: "Edad",
    edadPista: "11",
    edadAyuda: "Va en la tapa, al lado del nombre.",
    regala: "Quién se lo regala",
    // APROBADO por Naza 16/10 (tanda 8) · COMPRA-2-REGALA en España (tu madre, tu padre, tus padres)
    quienes: { mama: "Tu madre", papa: "Tu padre", papas: "Tus padres", abuela: "Tu abuela", abuelo: "Tu abuelo", abuelos: "Tus abuelos", otra: "Otra persona" },
    regalaOtraPista: "Tu tía, tus padrinos, tu madrina",
    regalaAyuda: "Así lo nombra el primer mensaje. Escríbelo como se lo dirías a quien lo recibe.",
    canal: "Por dónde llegan las preguntas",
    canalA: { titulo: "A su WhatsApp", detalle: "Le escribimos directo y responde cuando le apetece. Tú ves todo lo que cuenta desde tu panel." },
    suWhatsapp: "Su WhatsApp",
    // APROBADO por Naza 16/10 (tanda 8) · COMPRA-2-CANAL-A en España («adulto responsable», lectura de Marta)
    canalAutoriza: "Al elegir esto, eres tú, como adulto responsable, quien autoriza que le escribamos a ese número.",
    canalB: { titulo: "Lo hago yo", detalle: "Las preguntas llegan a tu WhatsApp. Te sientas a su lado, se las lees y responde con sus palabras." },
    hora: "A qué hora le escribimos",
    horaAyuda: "Mejor a la vuelta del cole, o cuando podáis sentaros juntos.",
    temasTitulo: "Temas y pago.",
    temasBajada: "Hay cosas que solo tú sabes si conviene tocar. Lo que marques aquí no se pregunta, y el libro se arma igual con el resto.",
    temasLeyenda: "No preguntar sobre",
    // APROBADO por Naza 16/10 (tanda 8) · COMPRA-3-TEMAS en España (Su madre / Su padre, Su nueva familia)
    temas: {
      mama: "Su madre",
      papa: "Su padre",
      "abuelo-murio": "Un abuelo o abuela que murió",
      ensamblada: "Su nueva familia (la pareja de su madre o de su padre, sus hijos)",
      mudanza: "Una mudanza o un cambio grande",
      escuela: "Un mal momento en el cole",
    },
    temasDebajo: "Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos.",
    fotos: "Pueden ir fotos con otros niños",
    fotosAyuda: "Si no la marcas, las fotos donde salen otros niños quedan fuera del libro.",
    pagar: (p) => `Pagar ${p}`,
    procesando: "Abriendo el pago…",
    despues: "Qué pasa después.",
    despuesTexto:
      "Después de pagar te llega un correo para entrar a tu panel. Si elegiste su WhatsApp, le escribimos para presentarnos y a ti te avisamos. Si lo haces tú, el primer mensaje llega a tu WhatsApp y la primera pregunta sale cuando estéis juntos.",
    legalAntes: "Al pagar aceptas los ",
    terminos: "términos",
    legalDespues: ".",
    proximamente: "Próximamente",
    proximamenteTexto: "Vitácora Kids todavía no se vende. Escríbenos y te avisamos cuando abra.",
    escribir: "Escríbenos",
    volver: "Volver a Vitácora Kids",
    marca: "Vitácora Kids",
    libroDe: (n) => `El libro de ${n}`,
    suLibro: "Su primer libro",
    resumen: "Tu pedido",
    total: "Total",
    pagoUnico: "Un solo pago, sin suscripciones.",
    errores: {
      faltaTuNombre: "Falta tu nombre.",
      faltaTuWhatsapp: "Falta tu WhatsApp.",
      correoMal: "Revisa el correo, parece que le falta algo.",
      faltaNombre: "Falta su nombre.",
      faltaApodo: "Falta cómo le llamáis.",
      faltaGenero: "Elige niño o niña.",
      edadMal: "Revisa la edad.",
      faltaQuien: "Falta quién se lo regala.",
      faltaCanal: "Elige por dónde llegan las preguntas.",
      faltaSuWhatsapp: "Falta su WhatsApp.",
    },
  },

  /* ─────────────────────────── Catalán, de tú ─────────────────────────── */
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    tituloPagina: "Vitácora Kids · Començar el seu llibre",
    descripcion: "Li fem preguntes per WhatsApp, respon amb àudios i amb fotos, i tot això es converteix en un llibre de debò.",
    pasos: ["Tu", "Qui ho explica", "Temes i pagament"],
    pasosEtiqueta: "Passos de la compra",
    pasoDe: (n, t) => `Pas ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Enrere",
    tuTitulo: "El llibre de la seva vida, explicat amb àudios.",
    tuBajada: "Li fem preguntes per WhatsApp, respon amb àudios i amb fotos, i tot això es converteix en un llibre de debò. Aquí van les teves dades.",
    tuNombre: "El teu nom",
    tuNombrePista: "Nom i cognom",
    tuWhatsapp: "El teu WhatsApp",
    tuWhatsappPista: "612 34 56 78",
    tuWhatsappAyuda: "Aquí t'avisem si cal i quan el llibre estigui llest.",
    correo: "El teu correu",
    correoPista: "tu@exemple.com",
    correoAyuda: "Amb aquest entres al teu panell, on veus tot el que explica.",
    quienTitulo: "Qui ho explica.",
    quienBajada: "El que necessitem perquè les preguntes li parlin bé i la tapa sigui seva.",
    suNombre: "El seu nom",
    suNombrePista: "Nom i cognom",
    suNombreAyuda: "Així va a la tapa.",
    apodo: "Com li dieu",
    apodoPista: "Com li dieu a casa",
    apodoAyuda: "Així el saludem als missatges.",
    genero: "Nen o nena",
    generos: { chico: "Nen", chica: "Nena" },
    generoAyuda: "Només perquè les preguntes li parlin bé.",
    edad: "Edat",
    edadPista: "11",
    edadAyuda: "Va a la tapa, al costat del nom.",
    regala: "Qui li regala",
    quienes: { mama: "La teva mare", papa: "El teu pare", papas: "Els teus pares", abuela: "La teva àvia", abuelo: "El teu avi", abuelos: "Els teus avis", otra: "Una altra persona" },
    regalaOtraPista: "La teva tieta, els teus padrins, la teva padrina",
    regalaAyuda: "Així ho diu el primer missatge. Escriu-ho com li diries a qui ho rep.",
    canal: "Per on arriben les preguntes",
    canalA: { titulo: "Al seu WhatsApp", detalle: "Li escrivim directament i respon quan en té ganes. Tu veus tot el que explica des del teu panell." },
    suWhatsapp: "El seu WhatsApp",
    canalAutoriza: "En triar això, ets tu, com a adult responsable, qui autoritza que li escrivim a aquest número.",
    canalB: { titulo: "Ho faig jo", detalle: "Les preguntes arriben al teu WhatsApp. T'asseus al seu costat, les hi llegeixes i respon amb les seves paraules." },
    hora: "A quina hora li escrivim",
    horaAyuda: "Millor quan torna de l'escola, o quan us pugueu asseure junts.",
    temasTitulo: "Temes i pagament.",
    temasBajada: "Hi ha coses que només tu saps si convé tocar. El que marquis aquí no es pregunta, i el llibre es fa igual amb la resta.",
    temasLeyenda: "No preguntar sobre",
    temas: {
      mama: "La seva mare",
      papa: "El seu pare",
      "abuelo-murio": "Un avi o una àvia que va morir",
      ensamblada: "La seva família reconstituïda (la parella de la mare o del pare, els seus fills)",
      mudanza: "Una mudança o un canvi gran",
      escuela: "Un mal moment a l'escola",
    },
    temasDebajo: "Tota la resta té un botó per passar. Si una pregunta no li agrada, se la salta i seguim.",
    fotos: "Hi poden anar fotos amb altres nens",
    fotosAyuda: "Si no la marques, les fotos on surten altres nens queden fora del llibre.",
    pagar: (p) => `Pagar ${p}`,
    procesando: "Obrint el pagament…",
    despues: "Què passa després.",
    despuesTexto:
      "Després de pagar et arriba un correu per entrar al teu panell. Si has triat el seu WhatsApp, li escrivim per presentar-nos i a tu t'avisem. Si ho fas tu, el primer missatge arriba al teu WhatsApp i la primera pregunta surt quan sigueu junts.",
    legalAntes: "En pagar acceptes els ",
    terminos: "termes",
    legalDespues: ".",
    proximamente: "Properament",
    proximamenteTexto: "Vitácora Kids encara no es ven. Escriu-nos i t'avisem quan obri.",
    escribir: "Escriu-nos",
    volver: "Tornar a Vitácora Kids",
    marca: "Vitácora Kids",
    libroDe: (n) => `El llibre de ${n}`,
    suLibro: "El seu primer llibre",
    resumen: "La teva comanda",
    total: "Total",
    pagoUnico: "Un sol pagament, sense subscripcions.",
    errores: {
      faltaTuNombre: "Falta el teu nom.",
      faltaTuWhatsapp: "Falta el teu WhatsApp.",
      correoMal: "Revisa el correu, sembla que hi falta alguna cosa.",
      faltaNombre: "Falta el seu nom.",
      faltaApodo: "Falta com li dieu.",
      faltaGenero: "Tria nen o nena.",
      edadMal: "Revisa l'edat.",
      faltaQuien: "Falta qui li regala.",
      faltaCanal: "Tria per on arriben les preguntes.",
      faltaSuWhatsapp: "Falta el seu WhatsApp.",
    },
  },

  /* ─────────── Argentina, de vos: las 3 pantallas TAL CUAL las aprobó Naza ─────────── */
  ar: {
    tituloPagina: "Vitácora Kids · Empezar su libro",
    descripcion: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    pasos: ["Vos", "Quién cuenta", "Temas y pago"],
    pasosEtiqueta: "Pasos de la compra",
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    tuTitulo: "El libro de su vida, contado con audios.",
    tuBajada: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad. Acá van tus datos.",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellido",
    tuWhatsapp: "Tu WhatsApp",
    tuWhatsappPista: "11 5555 1234",
    tuWhatsappAyuda: "Acá te avisamos si hace falta y cuando el libro esté listo.",
    correo: "Tu correo",
    correoPista: "vos@ejemplo.com",
    correoAyuda: "Con este entrás a tu panel, donde ves todo lo que cuenta.",
    quienTitulo: "Quién lo cuenta.",
    quienBajada: "Lo que necesitamos para que las preguntas le hablen bien y la tapa sea suya.",
    suNombre: "Su nombre",
    suNombrePista: "Nombre y apellido",
    suNombreAyuda: "Así va en la tapa.",
    apodo: "Cómo le dicen",
    apodoPista: "Como le dicen en casa",
    apodoAyuda: "Así lo saludamos en los mensajes.",
    genero: "Chico o chica",
    generos: { chico: "Chico", chica: "Chica" },
    generoAyuda: "Solo para que las preguntas le hablen bien.",
    edad: "Edad",
    edadPista: "11",
    edadAyuda: "Va en la tapa, al lado del nombre.",
    regala: "Quién se lo regala",
    quienes: { mama: "Tu mamá", papa: "Tu papá", papas: "Tus papás", abuela: "Tu abuela", abuelo: "Tu abuelo", abuelos: "Tus abuelos", otra: "Otra persona" },
    regalaOtraPista: "Tu tía, tus padrinos, tu madrina",
    regalaAyuda: "Así lo nombra el primer mensaje. Escribilo como se lo dirías a quien lo recibe.",
    canal: "Por dónde llegan las preguntas",
    canalA: { titulo: "A su WhatsApp", detalle: "Le escribimos directo y responde cuando tiene ganas. Vos ves todo lo que cuenta desde tu panel." },
    suWhatsapp: "Su WhatsApp",
    canalAutoriza: "Al elegir esto, sos vos, como adulto a cargo, quien autoriza que le escribamos a ese número.",
    canalB: { titulo: "Lo hago yo", detalle: "Las preguntas llegan a tu WhatsApp. Te sentás al lado, se las leés y responde con sus palabras." },
    hora: "A qué hora le escribimos",
    horaAyuda: "Mejor a la vuelta de la escuela, o cuando puedan sentarse juntos.",
    temasTitulo: "Temas y pago.",
    temasBajada: "Hay cosas que solo vos sabés si conviene tocar. Lo que marques acá no se pregunta, y el libro se arma igual con el resto.",
    temasLeyenda: "No preguntar sobre",
    temas: {
      mama: "Su mamá",
      papa: "Su papá",
      "abuelo-murio": "Un abuelo o abuela que murió",
      ensamblada: "Su familia ensamblada (la pareja de mamá o papá, sus hijos)",
      mudanza: "Una mudanza o un cambio grande",
      escuela: "Un mal momento en la escuela",
    },
    temasDebajo: "Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos.",
    fotos: "Pueden ir fotos con otros chicos",
    fotosAyuda: "Si no la marcás, las fotos donde aparecen otros chicos quedan fuera del libro.",
    pagar: (p) => `Pagar ${p}`,
    procesando: "Abriendo el pago…",
    despues: "Qué pasa después.",
    despuesTexto:
      "Después de pagar te llega un correo para entrar a tu panel. Si elegiste su WhatsApp, le escribimos para presentarnos y a vos te avisamos. Si lo hacés vos, el primer mensaje llega a tu WhatsApp y la primera pregunta sale cuando estén juntos.",
    legalAntes: "Al pagar aceptás los ",
    terminos: "términos",
    legalDespues: ".",
    proximamente: "Próximamente",
    proximamenteTexto: "Vitácora Kids todavía no se vende. Escribinos y te avisamos cuando abra.",
    escribir: "Escribinos",
    volver: "Volver a Vitácora Kids",
    marca: "Vitácora Kids",
    libroDe: (n) => `El libro de ${n}`,
    suLibro: "Su primer libro",
    resumen: "Tu pedido",
    total: "Total",
    pagoUnico: "Un solo pago, sin suscripciones.",
    errores: {
      faltaTuNombre: "Falta tu nombre.",
      faltaTuWhatsapp: "Falta tu WhatsApp.",
      correoMal: "Revisá el correo, parece que le falta algo.",
      faltaNombre: "Falta su nombre.",
      faltaApodo: "Falta cómo le dicen.",
      faltaGenero: "Elegí chico o chica.",
      edadMal: "Revisá la edad.",
      faltaQuien: "Falta quién se lo regala.",
      faltaCanal: "Elegí por dónde llegan las preguntas.",
      faltaSuWhatsapp: "Falta su WhatsApp.",
    },
  },
};

/**
 * El aviso de la compra cuando en el canal A el WhatsApp del chico es el mismo
 * que el del padre (`mismoNumero`, lib/kids-compra.ts). En vos aprobado por
 * Naza el 15/10 (docs/rediseno-2026-10/kids/textos-aprobados-2026-10-15.md,
 * punto 7); en tú, el 16/10 (tanda 8, textos-es-ES-2026-10-16.md).
 */
export const KIDS_MISMO_NUMERO_TEXTOS: Record<IdiomaKids, string> = {
  "es-AR": "El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a vos, elegí «Lo hago yo».",
  // APROBADO por Naza 16/10 (tanda 8)
  "es-ES": "El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a ti, elige «Lo hago yo».",
};
/** El de vos (Argentina). */
export const KIDS_MISMO_NUMERO = KIDS_MISMO_NUMERO_TEXTOS["es-AR"];

/**
 * El libro impreso en la compra de Kids (Naza 15/10, tanda 3, punto 10). Todo
 * lo demás es de la casa, tal cual (_textos/checkout: «¿Cómo querés su libro?»,
 * los títulos y las frases de las opciones, las copias, la dirección de envío y
 * sus avisos; _textos/pedido-confirmado: la línea de la imprenta). Estos dos
 * detalles son los de la casa SIN «Su voz», que Kids no define.
 */
export const KIDS_IMPRESO_TEXTOS: Record<IdiomaKids, { impresoDetalle: string; digitalDetalle: string }> = {
  "es-AR": {
    // APROBADO por Naza 16/10 (tanda 5) · la de la casa sin «con su voz»
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    // APROBADO por Naza 16/10 (tanda 5) · la de la casa sin «Su voz»
    digitalDetalle: "PDF para leer en cualquier pantalla.",
  },
  "es-ES": {
    // APROBADO por Naza 16/10 (tanda 8) · «el seguimiento del envío» (lectura de Marta)
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento del envío.",
    // APROBADO por Naza 16/10 (tanda 8)
    digitalDetalle: "PDF para leer en cualquier pantalla.",
  },
};
/** El de vos (Argentina). */
export const KIDS_IMPRESO = KIDS_IMPRESO_TEXTOS["es-AR"];
