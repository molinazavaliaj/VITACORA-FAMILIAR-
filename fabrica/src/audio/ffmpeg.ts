import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

/**
 * Normaliza el volumen (loudnorm) de un segmento de audio y lo convierte a
 * mp3. `extensionEntrada` sin el punto (ej. "ogg", "webm", "mp3") — los
 * distintos orígenes (respuestas grabadas, saludos, TTS) no siempre traen el
 * mismo formato.
 *
 * Los parámetros de stream van FIJOS (-ar 44100 -ac 1 -b:a 128k): el
 * audiolibro se arma después con `concat -c copy`, que NO recodifica — si un
 * segmento saliera con otro sample rate o canales (TTS a 24kHz mono vs. audio
 * de teléfono a 48kHz), el mp3 final se corrompe o cambia de velocidad al
 * cruzar la juntura. Todos los segmentos tienen que ser idénticos acá.
 */
export async function normalizarAMp3(buffer: Buffer, extensionEntrada: string): Promise<Buffer> {
  const dirTemp = await mkdtemp(path.join(tmpdir(), 'vitacora-audiolibro-'));
  const entradaPath = path.join(dirTemp, `entrada.${extensionEntrada}`);
  const salidaPath = path.join(dirTemp, 'salida.mp3');

  try {
    await writeFile(entradaPath, buffer);
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      entradaPath,
      '-af',
      'loudnorm',
      '-ar',
      '44100',
      '-ac',
      '1',
      '-b:a',
      '128k',
      '-acodec',
      'libmp3lame',
      salidaPath,
    ]);
    return await readFile(salidaPath);
  } finally {
    await rm(dirTemp, { recursive: true, force: true });
  }
}

/**
 * Concatena varios mp3 (mismo códec, ya normalizados) en uno solo vía el
 * demuxer concat de ffmpeg, que necesita un archivo de lista con paths.
 */
export async function concatenarMp3s(buffers: Buffer[]): Promise<Buffer> {
  const dirTemp = await mkdtemp(path.join(tmpdir(), 'vitacora-concat-'));
  const salidaPath = path.join(dirTemp, 'salida.mp3');
  const listaPath = path.join(dirTemp, 'lista.txt');

  try {
    const rutasEntrada: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const entradaPath = path.join(dirTemp, `parte_${i}.mp3`);
      await writeFile(entradaPath, buffers[i]);
      rutasEntrada.push(entradaPath);
    }

    const listaContenido = rutasEntrada
      .map((ruta) => `file '${ruta.replace(/'/g, "'\\''")}'`)
      .join('\n');
    await writeFile(listaPath, listaContenido);

    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listaPath,
      '-c',
      'copy',
      salidaPath,
    ]);
    return await readFile(salidaPath);
  } finally {
    await rm(dirTemp, { recursive: true, force: true });
  }
}
