// fabrica/src/escritor/controles/reparar-plan.ts
// Un arreglo del plan que hace el código antes de controlarlo, para no pagar el plan otra vez (07/10, libro entero
// de Joaquín: el plan se pagó 3 veces, USD 0,90 de más). No inventa nada: si la carta le habla a alguien que no dejó
// mensaje y el plan no lo anotó, se anota en faltantes ("no dejó mensaje para su hermana"); la carta no le habla, como
// manda la receta (nunca se inventa). (El otro motivo de esos reintentos era un choque entre C13 y C19: se arregló en C13.)
import type { Json } from '../tipos.js';
import { dedicadosSinMensaje } from './estructura.js';

export function repararPlan(plan: Json, reg: Json): { plan: Json; cambios: string[] } {
  const p = structuredClone(plan);
  const cambios: string[] = [];
  for (const { per } of dedicadosSinMensaje(p, reg)) {
    if (!per) continue;
    p.faltantes = [...(p.faltantes || []), { que: `no dejó mensaje para ${per.nombre}${per.relacion ? ` (${per.relacion})` : ''}`, donde: 'carta' }];
    cambios.push(`faltantes: no dejó mensaje para ${per.nombre}`);
  }
  return { plan: p, cambios };
}
