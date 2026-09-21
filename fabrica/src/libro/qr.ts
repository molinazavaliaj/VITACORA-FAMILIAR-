// Por qué existe: el libro impreso lleva un QR al lado de cada frase de «Su voz» y
// uno más grande para el código de la contratapa (spec 2026-09-20-su-voz-design).
// El PDF lo arma la fábrica en Railway, sin navegador y sin servicios externos:
// el código se dibuja acá adentro, con `qrcode` (JS puro, sin dependencias de red)
// y viaja como PNG en data URI dentro del mismo HTML que ya lleva las fotos.
//
// Dos decisiones pensadas para PAPEL y no para pantalla:
//  1. `margin: 4` — la quiet zone que pide el estándar (cuatro módulos de blanco
//     alrededor). Sin ese aire, los lectores de celular no enganchan el código.
//  2. `errorCorrectionLevel: 'M'` (recupera ~15%) — el link lleva el token
//     firmado, así que son ~200 caracteres y el QR sale denso. Subir a 'Q' mete
//     más módulos en el mismo cuadrado, o sea módulos más chicos: contra una
//     foto de celular eso duele más que la redundancia que suma.
import QRCode from 'qrcode';

/**
 * El lado del PNG de origen, en píxeles. Es el doble del tamaño al que se imprime
 * (96px en la sección, 132px el de la contratapa) para que el PDF lo tenga nítido
 * y el código se lea incluso si alguien escanea una foto del libro.
 */
const LADO_PX = 512;

/** El QR de un link, como PNG en data URI (nada de red: el HTML del libro es autocontenido). */
export function qrDataUri(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, {
    type: 'image/png',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: LADO_PX,
  });
}
