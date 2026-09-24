// Los modelos del esqueleto v2, por paso (decisión de Naza, 24/09, `docs/esqueleto-v2-guion-para-aprobar.md` §6).
// Opus donde se nota (lo que lee la persona); Sonnet donde es extracción o juicio con la ficha; Haiku
// donde solo se buscan pedidos (reserva, dejar, hoy no, parar). Un solo lugar: el gasto se anota con
// el modelo que de verdad se usó (`anotarUsos` en manual-v2.ts).

export const MODELO_PREGUNTA = 'claude-opus-5';
export const MODELO_FICHA = 'claude-sonnet-5';
export const MODELO_EVALUACION = 'claude-sonnet-5';
export const MODELO_PEDIDOS = 'claude-haiku-4-5';

export type PasoV2 = 'v2-presentacion' | 'v2-pregunta' | 'v2-repregunta' | 'v2-objeto' | 'v2-perfil' | 'v2-evaluar' | 'v2-pedidos';

export function modeloDePaso(paso: PasoV2): string {
  switch (paso) {
    case 'v2-perfil': return MODELO_FICHA;
    case 'v2-evaluar': return MODELO_EVALUACION;
    case 'v2-pedidos': return MODELO_PEDIDOS;
    default: return MODELO_PREGUNTA;
  }
}
