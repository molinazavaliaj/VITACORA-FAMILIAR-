import type { FichaKids } from "../src/lib/kids-compra";
import type { FilaKids, RespuestaKids } from "../src/lib/kids-panel";

// Datos y base de mentira para los tests del panel de Kids (K5).

export const FICHA: FichaKids = {
  nombre: "Tomás Pérez",
  apodo: "Tomi",
  genero: "chico",
  edad: 11,
  quienRegala: "tu mamá",
  canal: "A",
  nombrePadre: "Laura Gómez",
  linkPanel: "https://www.vitacorafamiliar.com/tablero/n1",
  hora: "18:00",
  zona: "America/Argentina/Buenos_Aires",
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

export function fila(parte: Partial<FilaKids> = {}): FilaKids {
  return {
    narrador_id: "n1",
    canal: "A",
    ficha: FICHA,
    fichaMotor: null,
    cambios_panel: null,
    cambios_error: null,
    avance: {},
    correcciones: [],
    termino_at: null,
    ...parte,
  };
}

let n = 0;
export function resp(clave: string | null, o: Partial<RespuestaKids> = {}): RespuestaKids {
  n++;
  return {
    id: `r${n}`,
    pregunta_orden: n,
    clave_kids: clave,
    audio_path: `n1/dia_${String(n).padStart(2, "0")}.ogg`,
    transcripcion: `lo que dijo ${n}`,
    texto_directo: null,
    duracion_segundos: 30,
    recibido_at: `2026-10-${String(10 + (n % 15)).padStart(2, "0")}T18:00:00Z`,
    ...o,
  };
}

// ── La base de mentira ───────────────────────────────────────────────────

type Llamada = { tabla: string; metodo: string; args: unknown[] };

/**
 * Cada `from(tabla)` toma el próximo resultado de su lista; se anota todo lo que se llama.
 * `archivos` = lo que hay en el bucket (ruta → contenido): `download` lo devuelve y
 * `createSignedUrl` firma cualquier ruta.
 */
export function baseFalsa(guion: Record<string, unknown[]>, archivos: Record<string, string> = {}) {
  const llamadas: Llamada[] = [];
  const usados: Record<string, number> = {};
  const from = (tabla: string) => {
    const i = usados[tabla] ?? 0;
    usados[tabla] = i + 1;
    const resultado = guion[tabla]?.[i] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const metodo of ["select", "eq", "is", "order", "update", "limit", "in"]) {
      b[metodo] = (...args: unknown[]) => {
        llamadas.push({ tabla, metodo, args });
        return b;
      };
    }
    b.maybeSingle = () => b;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  };
  const storage = {
    from: (bucket: string) => ({
      download: async (ruta: string) => {
        llamadas.push({ tabla: `storage:${bucket}`, metodo: "download", args: [ruta] });
        return ruta in archivos ? { data: { text: async () => archivos[ruta] }, error: null } : { data: null, error: { message: "Object not found" } };
      },
      createSignedUrl: async (ruta: string, segundos: number, opciones?: unknown) => {
        llamadas.push({ tabla: `storage:${bucket}`, metodo: "createSignedUrl", args: [ruta, segundos, opciones] });
        return { data: { signedUrl: `https://firmada.test/${ruta}` }, error: null };
      },
    }),
  };
  return { admin: { from, storage } as never, llamadas };
}

