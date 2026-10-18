import type { Textos } from "@/lib/idioma-web";

// «Su voz» de la casa (`/voz/<token>`, maqueta SuVoz): lo que abre el QR del
// libro y el chip del marco. Página pública sin cuenta: el idioma sale de quien
// la abre (la cookie si eligió uno en la web; si no, el país), como el aviso
// de enlace caducado. España de tú, Argentina de vos.
//
// Respecto de la maqueta: «Toca y escúchale» y «Así lo contaba él» dan por
// hecho que es un hombre (la página es de cualquier familiar), «23 historias»
// pasa a los audios que hay de verdad, y «Esta página es privada:» pierde los
// dos puntos. Lo nuevo va en docs/rediseno-2026-10/su-voz/textos.md (tanda 1 aprobada el
// 18/10 en es y ar; lo que dice PROPUESTA, todavía no).
// Los que ya estaban en la página vieja siguen igual (aprobados).
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosVoz = {
  /** SV-01 · la palabra de la cabecera, a la derecha del logo */
  privado: string;
  /** SV-02 · el botón grande sobre la foto */
  tocaYEscucha: string;
  /** SV-03 · lo que lee el lector de pantalla en ese botón */
  escucharA: (nombre: string) => string;
  /** SV-04 · la etiqueta de arriba del nombre */
  etiqueta: string;
  /** SV-05 · debajo del nombre: «Contado con su voz · 12 audios · 4 minutos» */
  datos: (audios: number, minutos: number) => string;
  /** SV-06 · la tarjeta del primer audio */
  empieza: string;
  /** SV-07 · el botón que baja al libro online */
  leer: string;
  /** SV-08 · etiqueta y titular de los capítulos */
  capEtiqueta: string;
  capTitulo: string;
  /** SV-09 · al lado de cada capítulo */
  audios: (n: number) => string;
  /** SV-10 · debajo de los primeros capítulos */
  verTodos: (n: number) => string;
  /** SV-11 · el carrusel */
  frasesDeSiempre: string;
  /** SV-12 · el bloque para la familia */
  familiaEtiqueta: string;
  familiaTexto: string;
  compartir: string;
  copiado: string;
  /** Lo que se ve en la hoja de compartir del teléfono (título del enlace). */
  compartirTitulo: (nombre: string) => string;
  copiaEsteLink: string;
  /** SV-13 · el cierre */
  cierre: string;
  cierreBoton: string;
  hechoCon: string;
  /** Los de siempre de la página vieja (aprobados en es y ar). */
  sinFrases: string;
  libro: string;
  libroNoEsta: string;
  /** Los botones de cada frase (aprobados en es y ar). */
  mandarWhatsapp: string;
  copiarLink: string;
  linkCopiado: string;
  mensajeFrase: (texto: string, nombre: string) => string;
  /** Para el lector de pantalla: «Escuchar: la frase «…»». */
  escuchar: string;
  pausar: string;
  etiquetaAudio: (texto: string) => string;
};

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export const TEXTOS_VOZ: Textos<TextosVoz> = {
  es: {
    // PROPUESTA · SV-01 (maqueta, tal cual)
    privado: "Privado",
    // APROBADO por Naza 18/10 (tanda 1, #1) · SV-02 (la maqueta decía «Toca y escúchale», que da por hecho que es un hombre)
    tocaYEscucha: "Toca y escucha su voz",
    // PROPUESTA · SV-03 (no se ve)
    escucharA: (nombre) => `Escuchar a ${nombre}`,
    // APROBADO por Naza 18/10 (tanda 1, #7) · SV-04 (maqueta, tal cual)
    etiqueta: "El libro de su vida",
    // APROBADO por Naza 18/10 (tanda 1, #3) · SV-05 (maqueta, con los audios que hay en vez de «historias»)
    datos: (audios, minutos) => ["Contado con su voz", plural(audios, "audio", "audios"), minutos > 0 ? plural(minutos, "minuto", "minutos") : null].filter(Boolean).join(" · "),
    // APROBADO por Naza 18/10 (tanda 1, #5) · SV-06 (maqueta, tal cual)
    empieza: "Empieza por aquí",
    // APROBADO por Naza 18/10 (tanda 1, #8) · SV-07 (maqueta, tal cual)
    leer: "Leer su libro",
    // APROBADO por Naza 18/10 (tanda 1, #9 y #2) · SV-08 (etiqueta de la maqueta; el titular era «Así lo contaba él.»)
    capEtiqueta: "Su voz, capítulo a capítulo",
    capTitulo: "Tal como lo contó.",
    // PROPUESTA · SV-09 (maqueta, tal cual)
    audios: (n) => plural(n, "audio", "audios"),
    // PROPUESTA · SV-10 (maqueta, tal cual)
    verTodos: (n) => `Ver los ${n} capítulos`,
    // APROBADO por Naza 18/10 (tanda 1, #10) · SV-11 (maqueta, tal cual)
    frasesDeSiempre: "Sus frases de siempre",
    // PROPUESTA · SV-12 (maqueta, tal cual)
    familiaEtiqueta: "Para la familia",
    // APROBADO por Naza 18/10 (tanda 1, #4) · SV-12 (maqueta, sin los dos puntos)
    familiaTexto: "Esta página es privada. Solo entra quien tiene el libro, el marco o el enlace. Puedes compartirla con quien quieras de la familia.",
    // PROPUESTA · SV-12 (maqueta, tal cual)
    compartir: "Compartir con la familia",
    copiado: "Enlace copiado",
    compartirTitulo: (nombre) => `${nombre}, en su voz`,
    copiaEsteLink: "Copia este link",
    // SV-13 · «En cada familia…» ya estaba (aprobado); la firma, PROPUESTA (maqueta, tal cual)
    cierre: "En cada familia hay un libro sin escribir.",
    // APROBADO por Naza 18/10 (tanda 1, #6) · SV-13 el botón, en vez del de la maqueta, para invitar a comprar
    cierreBoton: "Empezar el libro de mi familia",
    hechoCon: "Hecho con Vitácora",
    // Aprobados (página vieja)
    sinFrases: "Sus mejores frases, en su voz, se están preparando. Vuelve en un rato.",
    libro: "El libro",
    libroNoEsta: "El libro se está armando. Vuelve en un rato.",
    mandarWhatsapp: "Mandar por WhatsApp",
    copiarLink: "Copiar el link",
    linkCopiado: "Link copiado",
    mensajeFrase: (texto, nombre) => `«${texto}» — ${nombre}, en su voz.`,
    escuchar: "Escuchar",
    pausar: "Pausar",
    etiquetaAudio: (texto) => `la frase «${texto.slice(0, 40)}»`,
  },
  ar: {
    privado: "Privado",
    // APROBADO por Naza 18/10 (tanda 1, #1) · SV-02
    tocaYEscucha: "Tocá y escuchá su voz",
    escucharA: (nombre) => `Escuchar a ${nombre}`,
    etiqueta: "El libro de su vida",
    datos: (audios, minutos) => ["Contado con su voz", plural(audios, "audio", "audios"), minutos > 0 ? plural(minutos, "minuto", "minutos") : null].filter(Boolean).join(" · "),
    // APROBADO por Naza 18/10 (tanda 1, #5) · SV-06
    empieza: "Empezá por acá",
    leer: "Leer su libro",
    capEtiqueta: "Su voz, capítulo a capítulo",
    capTitulo: "Tal como lo contó.",
    audios: (n) => plural(n, "audio", "audios"),
    verTodos: (n) => `Ver los ${n} capítulos`,
    frasesDeSiempre: "Sus frases de siempre",
    familiaEtiqueta: "Para la familia",
    // APROBADO por Naza 18/10 (tanda 1, #4) · SV-12
    familiaTexto: "Esta página es privada. Solo entra quien tiene el libro, el marco o el link. Podés compartirla con quien quieras de la familia.",
    compartir: "Compartir con la familia",
    copiado: "Link copiado",
    compartirTitulo: (nombre) => `${nombre}, en su voz`,
    copiaEsteLink: "Copiá este link",
    cierre: "En cada familia hay un libro sin escribir.",
    // APROBADO por Naza 18/10 (tanda 1, #6) · SV-13
    cierreBoton: "Empezar el libro de mi familia",
    hechoCon: "Hecho con Vitácora",
    sinFrases: "Sus mejores frases, en su voz, se están preparando. Volvé en un rato.",
    libro: "El libro",
    libroNoEsta: "El libro se está armando. Volvé en un rato.",
    mandarWhatsapp: "Mandar por WhatsApp",
    copiarLink: "Copiar el link",
    linkCopiado: "Link copiado",
    mensajeFrase: (texto, nombre) => `«${texto}» — ${nombre}, en su voz.`,
    escuchar: "Escuchar",
    pausar: "Pausar",
    etiquetaAudio: (texto) => `la frase «${texto.slice(0, 40)}»`,
  },
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    privado: "Privat",
    tocaYEscucha: "Toca i escolta la seva veu",
    escucharA: (nombre) => `Escoltar ${nombre}`,
    etiqueta: "El llibre de la seva vida",
    datos: (audios, minutos) => ["Explicat amb la seva veu", plural(audios, "àudio", "àudios"), minutos > 0 ? plural(minutos, "minut", "minuts") : null].filter(Boolean).join(" · "),
    empieza: "Comença per aquí",
    leer: "Llegir el seu llibre",
    capEtiqueta: "La seva veu, capítol a capítol",
    capTitulo: "Tal com ho va explicar.",
    audios: (n) => plural(n, "àudio", "àudios"),
    verTodos: (n) => `Veure els ${n} capítols`,
    frasesDeSiempre: "Les seves frases de sempre",
    familiaEtiqueta: "Per a la família",
    familiaTexto: "Aquesta pàgina és privada. Només hi entra qui té el llibre, el marc o l'enllaç. La pots compartir amb qui vulguis de la família.",
    compartir: "Compartir amb la família",
    copiado: "Enllaç copiat",
    compartirTitulo: (nombre) => `${nombre}, amb la seva veu`,
    copiaEsteLink: "Copia aquest enllaç",
    cierre: "A cada família hi ha un llibre per escriure.",
    cierreBoton: "Començar el llibre de la meva família",
    hechoCon: "Fet amb Vitácora",
    sinFrases: "Les seves millors frases, amb la seva veu, s'estan preparant. Torna d'aquí a una estona.",
    libro: "El llibre",
    libroNoEsta: "El llibre s'està preparant. Torna d'aquí a una estona.",
    mandarWhatsapp: "Enviar per WhatsApp",
    copiarLink: "Copiar l'enllaç",
    linkCopiado: "Enllaç copiat",
    mensajeFrase: (texto, nombre) => `«${texto}» — ${nombre}, amb la seva veu.`,
    escuchar: "Escoltar",
    pausar: "Pausar",
    etiquetaAudio: (texto) => `la frase «${texto.slice(0, 40)}»`,
  },
};
