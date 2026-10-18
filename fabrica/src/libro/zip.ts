// Un ZIP simple, sin comprimir (método «stored»), para la descarga de los audios
// originales (audios-originales.ts). Los audios ya vienen comprimidos (ogg, mp3, m4a):
// comprimirlos de nuevo no achica nada y solo gasta tiempo. Sin dependencias: el
// formato «stored» son tres cabeceras fijas y el CRC32, que Node 22 trae en zlib.

import { crc32 } from 'node:zlib';

export type ArchivoZip = { nombre: string; datos: Buffer };

/** Fecha y hora en el formato de MS-DOS que pide el ZIP. */
function fechaDos(d: Date): { hora: number; fecha: number } {
  return {
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    fecha: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function armarZip(archivos: ArchivoZip[], cuando: Date = new Date()): Buffer {
  const { hora, fecha } = fechaDos(cuando);
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let desplazamiento = 0;

  for (const a of archivos) {
    const nombre = Buffer.from(a.nombre, 'utf8');
    const crc = crc32(a.datos) >>> 0;
    const tam = a.datos.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria
    local.writeUInt16LE(0x0800, 6); // el nombre va en UTF-8
    local.writeUInt16LE(0, 8); // sin comprimir
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(fecha, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(tam, 18);
    local.writeUInt32LE(tam, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);
    locales.push(local, nombre, a.datos);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(fecha, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(tam, 20);
    central.writeUInt32LE(tam, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt32LE(desplazamiento, 42);
    centrales.push(central, nombre);

    desplazamiento += 30 + nombre.length + tam;
  }

  const tamCentral = centrales.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(tamCentral, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  return Buffer.concat([...locales, ...centrales, fin]);
}
