import type { TratoComprador } from "@/lib/regalo-textos";

// Los textos de /entrar (rediseño 2026-10, arreglos chicos; maquetas `Entrar`
// y `EntrarMovil`). Los del código de 6 números son los aprobados de siempre
// (el formulario ya los tenía); los de la maqueta van tal cual, y lo que hubo
// que escribir de nuevo está en
// docs/rediseno-2026-10/arreglos-chicos/textos.md como PROPUESTA.
// España de tú, Argentina de vos (el trato sale del país de quien entra).

export type TextosEntrar = {
  etiqueta: string;
  titulo: string;
  bajada: string;
  correoEtiqueta: string;
  correoPista: string;
  enviar: string;
  enviando: string;
  errorEnvio: string;
  codigoEnviado: string;
  escribiloAca: string;
  entrar: string;
  entrando: string;
  errorCodigo: string;
  otroEnviado: string;
  pedirOtro: string;
  otroCorreo: string;
  volver: string;
  notaTitulo: string;
  notaTexto: string;
  citaFoto: string;
  pieFoto: string;
  altFoto: string;
};

const ES: TextosEntrar = {
  etiqueta: "Tu área",
  titulo: "Entra para ver cómo va su libro.",
  bajada: "Te mandamos un código de 6 números a tu correo. Sin contraseñas.",
  correoEtiqueta: "El email con el que compraste",
  correoPista: "tu@correo.com",
  enviar: "Enviarme el código",
  enviando: "Enviando...",
  errorEnvio: "No pudimos enviar el código. Prueba de nuevo en un momento.",
  codigoEnviado: "Te mandamos un código a",
  escribiloAca: "Escríbelo aquí:",
  entrar: "Entrar",
  entrando: "Entrando...",
  errorCodigo: "El código no es correcto o ya venció. Revísalo o pide uno nuevo.",
  otroEnviado: "Te mandamos otro código a",
  pedirOtro: "Pedir otro código",
  otroCorreo: "Usar otro correo",
  volver: "Volver a la web",
  notaTitulo: "¿Te han regalado el libro y eres quien lo cuenta?",
  // PROPUESTA (textos.md 1): la de la maqueta llevaba dos puntos.
  notaTexto: "No necesitas entrar aquí. Todo lo haces desde WhatsApp, y ahí te llega el enlace para escuchar tu libro.",
  citaFoto: "«Tocaba fatal, pero tocaba fuerte.»",
  pieFoto: "Osvaldo, en su libro",
  // PROPUESTA (textos.md 1): el texto alternativo de la foto.
  altFoto: "Osvaldo de joven, sentado en un muro de piedra, toca la guitarra en una calle de su pueblo",
};

const AR: TextosEntrar = {
  ...ES,
  // PROPUESTA (textos.md 1): el título de la maqueta, de vos.
  titulo: "Entrá para ver cómo va su libro.",
  errorEnvio: "No pudimos enviar el código. Probá de nuevo en un momento.",
  escribiloAca: "Escribilo acá:",
  errorCodigo: "El código no es correcto o ya venció. Revisalo o pedí uno nuevo.",
  // PROPUESTA (textos.md 1): la nota de la maqueta, de vos.
  notaTitulo: "¿Te regalaron el libro y sos quien lo cuenta?",
  notaTexto: "No necesitás entrar acá. Todo lo hacés desde WhatsApp, y ahí te llega el enlace para escuchar tu libro.",
  altFoto: "Osvaldo de joven, sentado en un muro de piedra, toca la guitarra en una calle de su pueblo",
};

export const textosEntrar = (trato: TratoComprador): TextosEntrar => (trato === "tu" ? ES : AR);
