// Base en memoria para los tests de la V3: el subconjunto de supabase-js que
// usa `entrevistador/src/v3/` (select/insert/update/upsert/delete con eq, in,
// is, lt, lte, gt, gte, not-is, order, limit, single, maybeSingle, count) y el
// storage (upload, list, remove, download). Simula el único de
// `respuestas.wa_message_id` (23505) y una tabla sin migrar (42P01).

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Fila = Record<string, any>;
type ErrorBase = { code: string; message: string };
type Resultado = { data: any; error: ErrorBase | null; count?: number | null };

/** La clave primaria de las tablas que no usan `id`. */
const CLAVE: Record<string, string> = { entrevistas_v3: 'narrador_id' };
const UNICOS: Record<string, string[]> = {
  respuestas: ['wa_message_id'],
  entrevistas_v3: ['narrador_id'],
  narradores: ['telefono_whatsapp'],
};
const DEFAULTS: Record<string, () => Fila> = {
  respuestas: () => ({ recibido_at: new Date().toISOString(), es_repregunta: false, clave_v3: null, wa_message_id: null, transcripcion: null, texto_directo: null }),
  entrevistas_v3: () => ({ version: 0, tanda_cuenta: 0, ultimo_audio_at: null, tanda_dia: null, enviando_hasta: null, creada_at: new Date().toISOString(), migrada_de: null }),
  envios: () => ({ enviado_at: new Date().toISOString() }),
  narradores: () => ({ estado: 'invitado', dia_actual: 0, contexto: {}, hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', ultima_respuesta_at: null, alerta_silencio: false }),
};

export type BaseFalsa = {
  tablas: Record<string, Fila[]>;
  /** "bucket/path" → contenido (texto). */
  archivos: Map<string, string>;
  /** Tablas que "no existen" (la migración sin aplicar). */
  ausentes: Set<string>;
  /** La próxima escritura a esa tabla devuelve este error (una sola vez). */
  fallarProxima: Map<string, ErrorBase>;
  cliente: SupabaseClient;
};

const copia = <T>(x: T): T => (x === undefined ? x : (JSON.parse(JSON.stringify(x)) as T));

class Consulta implements PromiseLike<Resultado> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filtros: ((f: Fila) => boolean)[] = [];
  private valores: Fila | Fila[] | undefined;
  private orden: { col: string; asc: boolean } | undefined;
  private limite: number | undefined;
  private unica: 'single' | 'maybe' | undefined;
  private devolver = false;
  private contar = false;
  private soloCuenta = false;

  constructor(private base: BaseFalsa, private tabla: string) {}

  select(_columnas?: string, o?: { count?: 'exact'; head?: boolean }) {
    if (this.op !== 'select') this.devolver = true;
    if (o?.count) this.contar = true;
    if (o?.head) this.soloCuenta = true;
    return this;
  }
  insert(v: Fila | Fila[]) { this.op = 'insert'; this.valores = v; return this; }
  upsert(v: Fila | Fila[]) { this.op = 'upsert'; this.valores = v; return this; }
  update(v: Fila) { this.op = 'update'; this.valores = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c: string, v: unknown) { this.filtros.push((f) => f[c] === v); return this; }
  neq(c: string, v: unknown) { this.filtros.push((f) => f[c] !== v); return this; }
  in(c: string, vs: unknown[]) { this.filtros.push((f) => vs.includes(f[c])); return this; }
  is(c: string, v: null | boolean) { this.filtros.push((f) => (f[c] ?? null) === v); return this; }
  lt(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] < v); return this; }
  lte(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] <= v); return this; }
  gt(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] > v); return this; }
  gte(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] >= v); return this; }
  not(c: string, op: string, v: unknown) {
    if (op !== 'is') throw new Error(`base falsa: not(${c}, ${op}) no está implementado`);
    this.filtros.push((f) => (f[c] ?? null) !== v);
    return this;
  }
  order(c: string, o: { ascending?: boolean } = {}) { this.orden = { col: c, asc: o.ascending !== false }; return this; }
  limit(n: number) { this.limite = n; return this; }
  single() { this.unica = 'single'; return this; }
  maybeSingle() { this.unica = 'maybe'; return this; }

  then<A = Resultado, B = never>(ok?: ((r: Resultado) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.ejecutar()).then(ok, ko);
  }

  private ejecutar(): Resultado {
    if (this.base.ausentes.has(this.tabla)) {
      return { data: null, error: { code: '42P01', message: `relation "${this.tabla}" does not exist` } };
    }
    const filas = (this.base.tablas[this.tabla] ??= []);
    if (this.op !== 'select') {
      const falla = this.base.fallarProxima.get(this.tabla);
      if (falla) {
        this.base.fallarProxima.delete(this.tabla);
        return { data: null, error: falla };
      }
    }
    const coincide = (f: Fila) => this.filtros.every((p) => p(f));
    let afectadas: Fila[] = [];
    if (this.op === 'select') afectadas = filas.filter(coincide);
    if (this.op === 'insert' || this.op === 'upsert') {
      const clave = CLAVE[this.tabla] ?? 'id';
      for (const v of Array.isArray(this.valores) ? this.valores : [this.valores!]) {
        const existente = filas.find((f) => v[clave] !== undefined && f[clave] === v[clave]);
        if (this.op === 'upsert' && existente) {
          Object.assign(existente, copia(v));
          afectadas.push(existente);
          continue;
        }
        const nueva: Fila = { ...(clave === 'id' ? { id: randomUUID() } : {}), ...(DEFAULTS[this.tabla]?.() ?? {}), ...copia(v) };
        for (const col of UNICOS[this.tabla] ?? []) {
          if (nueva[col] != null && filas.some((f) => f[col] === nueva[col])) {
            return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${this.tabla}_${col}"` } };
          }
        }
        filas.push(nueva);
        afectadas.push(nueva);
      }
    }
    if (this.op === 'update') {
      afectadas = filas.filter(coincide);
      for (const f of afectadas) Object.assign(f, copia(this.valores));
    }
    if (this.op === 'delete') {
      afectadas = filas.filter(coincide);
      this.base.tablas[this.tabla] = filas.filter((f) => !coincide(f));
    }
    if (this.orden) {
      const { col, asc } = this.orden;
      afectadas = [...afectadas].sort((a, b) => (a[col] === b[col] ? 0 : (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1)));
    }
    if (this.limite !== undefined) afectadas = afectadas.slice(0, this.limite);
    const count = this.contar ? afectadas.length : null;
    if ((this.op !== 'select' && !this.devolver) || this.soloCuenta) return { data: null, error: null, count };
    const data = afectadas.map((f) => copia(f));
    if (this.unica === 'single') {
      return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: `se esperaba 1 fila y hay ${data.length}` } };
    }
    if (this.unica === 'maybe') {
      return data.length <= 1 ? { data: data[0] ?? null, error: null } : { data: null, error: { code: 'PGRST116', message: `se esperaba 0 o 1 fila y hay ${data.length}` } };
    }
    return { data, error: null, count };
  }
}

function almacen(base: BaseFalsa, bucket: string) {
  const ruta = (p: string) => `${bucket}/${p}`;
  return {
    async upload(path: string, datos: Buffer | string, o?: { upsert?: boolean; contentType?: string }) {
      if (base.archivos.has(ruta(path)) && !o?.upsert) return { data: null, error: { message: 'The resource already exists' } };
      base.archivos.set(ruta(path), Buffer.isBuffer(datos) ? datos.toString('utf8') : String(datos));
      return { data: { path }, error: null };
    },
    async remove(paths: string[]) {
      for (const p of paths) base.archivos.delete(ruta(p));
      return { data: paths.map((name) => ({ name })), error: null };
    },
    async list(prefijo: string) {
      const pre = `${ruta(prefijo)}/`;
      return { data: [...base.archivos.keys()].filter((k) => k.startsWith(pre)).map((k) => ({ name: k.slice(pre.length) })), error: null };
    },
    async download(path: string) {
      const c = base.archivos.get(ruta(path));
      return c === undefined ? { data: null, error: { message: 'Object not found' } } : { data: new Blob([c]), error: null };
    },
  };
}

export function crearBaseFalsa(inicial: Record<string, Fila[]> = {}): BaseFalsa {
  const base: BaseFalsa = {
    tablas: Object.fromEntries(Object.entries(inicial).map(([t, filas]) => [t, filas.map((f) => copia(f))])),
    archivos: new Map(),
    ausentes: new Set(),
    fallarProxima: new Map(),
    cliente: undefined as unknown as SupabaseClient,
  };
  base.cliente = {
    from: (tabla: string) => new Consulta(base, tabla),
    storage: { from: (bucket: string) => almacen(base, bucket) },
  } as unknown as SupabaseClient;
  return base;
}
