// El modelo falso de los tests: devuelve respuestas guardadas (las de Nélida, o las de la corrida real
// del libro de Joaquín). Busca por la clave sin etapa ("1-registro#2"), después por la base
// ("1-registro") y después por prefijo ("7-estilo-").
import type { UsoApi } from '../costos.js';
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo, type ResultadoLote } from './tipos.js';

export const claveBase = (clave: string): string => clave.replace(/^[ABC]\//, '').replace(/#.*$/, '');

export class ModeloFalso implements Modelo {
  readonly llamadas: PedidoModelo[] = [];
  constructor(
    private readonly salidas: Record<string, string>,
    private readonly defectos: [string, string][] = [],
    private readonly uso: UsoApi = { input_tokens: 1000, output_tokens: 100 },
  ) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    this.llamadas.push(p);
    const sinEtapa = p.clave.replace(/^[ABC]\//, '');
    const base = claveBase(p.clave);
    const texto = this.salidas[sinEtapa] ?? this.salidas[base] ?? this.defectos.find(([pre]) => base.startsWith(pre))?.[1];
    if (texto === undefined) throw new ErrorDelModelo(`el modelo falso no tiene respuesta para ${p.clave}`, false);
    return { texto, uso: this.uso, motivoFin: 'end_turn' };
  }
}

export class LoteFalso implements Lote {
  readonly grupos: string[] = [];
  constructor(private readonly modelo: Modelo, private readonly falla: Set<string> = new Set()) {}
  async enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> {
    this.grupos.push(grupo);
    const out: ResultadoLote[] = [];
    for (const p of pedidos) {
      if (this.falla.has(claveBase(p.clave))) out.push({ clave: p.clave, ok: false, error: 'errored' });
      else out.push({ clave: p.clave, ok: true, respuesta: await this.modelo.llamar(p) });
    }
    return out;
  }
}
