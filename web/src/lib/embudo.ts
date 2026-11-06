// El embudo de la compra (checkout etapa 1, 06/11): un contador por día, sin cookies, sin IP,
// sin correo y sin identificador de persona. Acá vive lo que no depende de Next: qué se acepta
// y cómo se arma la tabla del panel. Lo usan app/api/embudo/route.ts y /admin/embudo.

export const COMPRAS_EMBUDO = ["familiar"] as const;
export const PASOS_EMBUDO = ["entro", "para_quien", "pago", "pagar", "pagado"] as const;
export const REGIONES_EMBUDO = ["ES", "AR"] as const;
export const DISPOSITIVOS_EMBUDO = ["celular", "compu"] as const;

export type CompraEmbudo = (typeof COMPRAS_EMBUDO)[number];
export type PasoEmbudo = (typeof PASOS_EMBUDO)[number];
export type RegionEmbudo = (typeof REGIONES_EMBUDO)[number];
export type DispositivoEmbudo = (typeof DISPOSITIVOS_EMBUDO)[number];

export type EventoEmbudo = { compra: CompraEmbudo; paso: PasoEmbudo; region: RegionEmbudo; dispositivo: DispositivoEmbudo };

const esDe = <T extends string>(lista: readonly T[], x: unknown): x is T => typeof x === "string" && (lista as readonly string[]).includes(x);

/** Valida el cuerpo. Rechaza (null) cualquier valor fuera de las listas; ignora campos de más. */
export function validarEmbudo(cuerpo: unknown): EventoEmbudo | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const c = cuerpo as Record<string, unknown>;
  if (!esDe(COMPRAS_EMBUDO, c.compra) || !esDe(PASOS_EMBUDO, c.paso) || !esDe(REGIONES_EMBUDO, c.region) || !esDe(DISPOSITIVOS_EMBUDO, c.dispositivo)) return null;
  return { compra: c.compra, paso: c.paso, region: c.region, dispositivo: c.dispositivo };
}

export type FilaEmbudo = { dia: string; compra: string; paso: string; region: string; dispositivo: string; cuenta: number };

export type LineaEmbudo = {
  region: RegionEmbudo;
  dispositivo: DispositivoEmbudo;
  /** Cuenta por paso, en el orden de PASOS_EMBUDO. */
  cuentas: Record<PasoEmbudo, number>;
  /** Porcentaje respecto de «entro»; null si nadie entró. */
  porcentajes: Record<PasoEmbudo, number | null>;
};

/** Suma las filas por región y dispositivo. Siempre devuelve las cuatro combinaciones. */
export function armarEmbudo(filas: FilaEmbudo[]): LineaEmbudo[] {
  const lineas: LineaEmbudo[] = [];
  for (const region of REGIONES_EMBUDO) {
    for (const dispositivo of DISPOSITIVOS_EMBUDO) {
      const cuentas = Object.fromEntries(PASOS_EMBUDO.map((p) => [p, 0])) as Record<PasoEmbudo, number>;
      for (const f of filas) {
        if (f.region === region && f.dispositivo === dispositivo && esDe(PASOS_EMBUDO, f.paso)) cuentas[f.paso] += Number(f.cuenta) || 0;
      }
      const porcentajes = Object.fromEntries(
        PASOS_EMBUDO.map((p) => [p, cuentas.entro > 0 ? Math.round((cuentas[p] / cuentas.entro) * 1000) / 10 : null]),
      ) as Record<PasoEmbudo, number | null>;
      lineas.push({ region, dispositivo, cuentas, porcentajes });
    }
  }
  return lineas;
}
