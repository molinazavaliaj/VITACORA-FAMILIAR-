// fabrica/src/escritor/ejecutor.ts
// Todas las llamadas al modelo del escritor pasan por acá:
// - checkpoint por llamada: cada respuesta queda en el almacén con el hash del pedido; si se corta,
//   volver a correr la etapa saca de ahí lo ya pagado (y lo suma al gasto del libro);
// - reintentos con espera para errores de API (red, 429, 529, 5xx);
// - un corte por max_tokens se repite una sola vez, con el mismo pedido; si se corta de nuevo, la llamada falla;
// - un reintento si el JSON no parsea (receta, sección 5);
// - tope de gasto por libro (USD 15 por defecto): con el tope alcanzado no sale ninguna llamada nueva;
//   lo que la API cobró en un intento fallido (rechazo, corte) también suma, y queda en `fallas.json`
//   para que una corrida nueva lo cuente (si no, volver a correr esquivaría el tope);
// - una fila de uso por llamada (costos.json);
// - fases paralelas: con lote (Batch, mitad de precio) o en paralelo con límite; lo que el lote
//   devuelve con error se repite sin lote (un corte en el lote ya cuenta como el primer corte);
//   si la fase falla, ningún trabajador arranca otra llamada.
// Los reintentos son SOLO los de acá: el cliente del SDK reintenta solo (maxRetries 2 por defecto) y los
// reintentos se apilarían. Por eso el cliente real se crea con OPCIONES_CLIENTE: new Anthropic(OPCIONES_CLIENTE).
import { createHash } from 'node:crypto';
import type { Almacen } from './almacen/tipos.js';
import { parseJSONTolerante } from './carpeta.js';
import { usdDeLlamada, type UsoApi } from './costos.js';
import type { Llamada } from './llamadas/armar.js';
import { armarParams, bloquesDeLlamada, puntosDeCache } from './modelo/pedido.js';
import { ErrorDelModelo, type Esfuerzo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo } from './modelo/tipos.js';

/** Opciones para crear el cliente de Anthropic: sin reintentos del SDK (la política es la del ejecutor). */
export const OPCIONES_CLIENTE = { maxRetries: 0 } as const;

export type Rol = { modelo: string; maxTokens: number; esfuerzo: Esfuerzo };
/** Opus en todo lo que escribe (Naza, 02/10); el barato solo corrige el registro (spec, decisión 4). Se ajusta después de la prueba paga. */
export const ROLES: Record<'opus' | 'barato', Rol> = {
  opus: { modelo: 'claude-opus-5-5', maxTokens: 64000, esfuerzo: 'xhigh' },
  barato: { modelo: 'claude-sonnet-5-5', maxTokens: 64000, esfuerzo: 'low' },
};

export type Encargo = { clave: string; llamada: Llamada; json: boolean; rol?: 'opus' | 'barato'; maxTokens?: number };
/** `falla: true` = un intento que la API cobró pero no sirvió (rechazo, corte); no queda en la memoria. */
export type FilaUso = { clave: string; modelo: string; lote: boolean; de_memoria: boolean; input: number; output: number; cache_write: number; cache_read: number; usd: number; falla?: boolean };
export type OpcionesEjecutor = { modelo: Modelo; lote?: Lote; almacen: Almacen; topeUsd?: number; esperar?: (ms: number) => Promise<void>; esperasMs?: number[]; limite?: number; log?: (s: string) => void };
export type ResultadoVarios = { textos: Map<string, string>; fallas: Map<string, string> };

export class TopeDeGasto extends Error {
  constructor(mensaje: string) { super(mensaje); this.name = 'TopeDeGasto'; }
}
export class ErrorJSON extends Error {
  constructor(mensaje: string) { super(mensaje); this.name = 'ErrorJSON'; }
}

type Memoria = { hash: string; texto: string; fila: FilaUso };
const RUTA_FALLAS = 'fallas.json';
// El reintento lleva '#' en la clave ("C/3b-capitulo-06#2"): ni '#' ni '~' son claves válidas de Supabase
// Storage (isValidKey del servidor; ver test/escritor/claves-storage.test.ts). '__' sí, y ninguna clave lo trae.
const rutaPaso = (clave: string): string => `pasos/${clave.replace(/#/g, '__')}.json`;
const n = (v: number | null | undefined): number => (typeof v === 'number' ? v : 0);
const esJSON = (t: string): boolean => { try { parseJSONTolerante(t); return true; } catch { return false; } };

async function enParalelo<T>(xs: T[], limite: number, f: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  // Si un trabajador falla, los demás terminan lo que tienen en curso pero no toman nada nuevo (nada más que pagar).
  let parado = false;
  const trabajar = async (): Promise<void> => {
    while (!parado && i < xs.length) {
      try {
        await f(xs[i++]);
      } catch (err) {
        parado = true;
        throw err;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, xs.length) }, trabajar));
}

export class Ejecutor {
  readonly filas: FilaUso[] = [];
  private readonly anotadas = new Set<string>();
  private readonly tope: number;
  /** Cortes por max_tokens que ya pasaron en el lote, por clave: el intento sin lote arranca con ese conteo. */
  private readonly cortesPrevios = new Map<string, number>();
  private fallasCargadas: Promise<void> | null = null;
  private guardandoFallas: Promise<void> = Promise.resolve();

  constructor(private readonly o: OpcionesEjecutor) {
    this.tope = o.topeUsd ?? 15;
  }

  /** Incluye las fallas pagas de corridas anteriores desde el primer `uno`/`varios`/`guardarCostos`. */
  get gastado(): number {
    return Math.round(this.filas.reduce((s, f) => s + f.usd, 0) * 1e6) / 1e6;
  }

  pedido(e: Encargo): PedidoModelo {
    const rol = ROLES[e.rol ?? 'opus'];
    return { clave: e.clave, modelo: rol.modelo, bloques: bloquesDeLlamada(e.llamada), cacheEn: puntosDeCache(e.llamada.nombre, e.llamada.docs), maxTokens: e.maxTokens ?? rol.maxTokens, esfuerzo: rol.esfuerzo };
  }

  private hash(p: PedidoModelo): string {
    return createHash('sha256').update(JSON.stringify(armarParams(p))).digest('hex');
  }

  private async memoria(p: PedidoModelo): Promise<Memoria | null> {
    const t = await this.o.almacen.leer(rutaPaso(p.clave));
    if (t === null) return null;
    const m = JSON.parse(t) as Memoria;
    return m.hash === this.hash(p) ? m : null;
  }

  private fila(p: PedidoModelo, u: UsoApi, lote: boolean): FilaUso {
    return { clave: p.clave, modelo: p.modelo, lote, de_memoria: false, input: n(u.input_tokens), output: n(u.output_tokens), cache_write: n(u.cache_creation_input_tokens), cache_read: n(u.cache_read_input_tokens), usd: usdDeLlamada(p.modelo, u, { lote }) };
  }

  private async anotar(p: PedidoModelo, r: RespuestaModelo, lote: boolean): Promise<void> {
    const fila = this.fila(p, r.uso, lote);
    this.filas.push(fila);
    this.anotadas.add(p.clave);
    // Se guarda aunque el JSON no sirva: el gasto queda anotado y el reintento usa otra clave.
    await this.o.almacen.escribir(rutaPaso(p.clave), JSON.stringify({ hash: this.hash(p), texto: r.texto, fila } satisfies Memoria));
  }

  /** Las fallas pagas de corridas anteriores (`fallas.json`), una sola vez por ejecutor, antes de cualquier llamada. */
  private cargarFallas(): Promise<void> {
    this.fallasCargadas ??= (async () => {
      const t = await this.o.almacen.leer(RUTA_FALLAS);
      if (t !== null) this.filas.unshift(...(JSON.parse(t) as FilaUso[]).map((f) => ({ ...f, de_memoria: true })));
    })();
    return this.fallasCargadas;
  }

  /** Un intento que la API cobró y no sirvió: suma al gasto (y al tope) y queda en `fallas.json`, pero no va a la memoria. */
  private async anotarFalla(p: PedidoModelo, uso: UsoApi, lote: boolean): Promise<void> {
    const fila: FilaUso = { ...this.fila(p, uso, lote), falla: true };
    this.filas.push(fila);
    // En fila: dos trabajadores en paralelo no se pisan el archivo.
    this.guardandoFallas = this.guardandoFallas.then(async () => {
      const t = await this.o.almacen.leer(RUTA_FALLAS);
      const previas = t === null ? [] : (JSON.parse(t) as FilaUso[]);
      await this.o.almacen.escribir(RUTA_FALLAS, JSON.stringify([...previas, fila]));
    });
    await this.guardandoFallas;
  }

  private verificarTope(): void {
    if (this.gastado >= this.tope) throw new TopeDeGasto(`se gastaron USD ${this.gastado.toFixed(4)} y el tope del libro es USD ${this.tope}`);
  }

  private async llamarConReintentos(p: PedidoModelo): Promise<RespuestaModelo> {
    const esperas = this.o.esperasMs ?? [30_000, 120_000, 300_000];
    const esperar = this.o.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    let i = 0;
    let cortes = this.cortesPrevios.get(p.clave) ?? 0;
    for (;;) {
      this.verificarTope();
      try {
        return await this.o.modelo.llamar(p);
      } catch (err) {
        if (!(err instanceof ErrorDelModelo)) throw err;
        if (err.uso) await this.anotarFalla(p, err.uso, false);
        if (err.porMaxTokens) {
          // Un corte se repite una vez, sin esperar; el segundo corta la llamada (cada uno puede costar más de un dólar).
          if (cortes++ >= 1) throw new ErrorDelModelo(`${p.clave}: la respuesta se cortó por max_tokens dos veces`, false, { porMaxTokens: true });
          this.o.log?.(`${p.clave}: ${err.message}; se pide una vez más`);
          continue;
        }
        if (!err.reintentable || i >= esperas.length) throw err;
        this.o.log?.(`${p.clave}: ${err.message}; reintento en ${Math.round(esperas[i] / 1000)} s`);
        await esperar(esperas[i]);
        i++;
      }
    }
  }

  private async crudo(e: Encargo): Promise<string> {
    const p = this.pedido(e);
    const m = await this.memoria(p);
    if (m) {
      if (!this.anotadas.has(p.clave)) {
        this.filas.push({ ...m.fila, de_memoria: true });
        this.anotadas.add(p.clave);
      }
      return m.texto;
    }
    const r = await this.llamarConReintentos(p);
    await this.anotar(p, r, false);
    return r.texto;
  }

  /** Una llamada: de la memoria si ya se pagó; si no, a la API. Con json, un pedido más si no parsea. */
  async uno(e: Encargo): Promise<string> {
    await this.cargarFallas();
    const texto = await this.crudo(e);
    if (!e.json || esJSON(texto)) return texto;
    this.o.log?.(`${e.clave}: el JSON no parsea; se pide otra vez`);
    const otra = await this.crudo({ ...e, clave: `${e.clave}#json` });
    if (esJSON(otra)) return otra;
    throw new ErrorJSON(`${e.clave}: el JSON no parsea dos veces`);
  }

  /** Una fase paralela. Con lote, lo que no está en memoria va por Batch; después todo se resuelve con `uno`. */
  async varios(es: Encargo[], o: { lote: boolean; grupo: string }): Promise<ResultadoVarios> {
    const textos = new Map<string, string>();
    const fallas = new Map<string, string>();
    await this.cargarFallas();
    if (o.lote && this.o.lote) {
      const pendientes: PedidoModelo[] = [];
      for (const e of es) { const p = this.pedido(e); if (!(await this.memoria(p))) pendientes.push(p); }
      if (pendientes.length) {
        this.verificarTope();
        for (const r of await this.o.lote.enviar(o.grupo, pendientes)) {
          const p = pendientes.find((x) => x.clave === r.clave) as PedidoModelo;
          if (r.ok) await this.anotar(p, r.respuesta, true);
          else {
            if (r.uso) await this.anotarFalla(p, r.uso, true);
            if (r.porMaxTokens) this.cortesPrevios.set(p.clave, 1);
            this.o.log?.(`${r.clave}: el lote volvió con error (${r.error}); va sin lote`);
          }
        }
      }
    }
    await enParalelo(es, this.o.limite ?? 4, async (e) => {
      try {
        textos.set(e.clave, await this.uno(e));
      } catch (err) {
        if (err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable)) fallas.set(e.clave, err.message);
        else throw err;
      }
    });
    return { textos, fallas };
  }

  async guardarCostos(): Promise<void> {
    await this.cargarFallas();
    await this.o.almacen.escribir('costos.json', JSON.stringify({ total_usd: this.gastado, tope_usd: this.tope, filas: this.filas }, null, 1));
  }
}
