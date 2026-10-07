// Las reglas del regalo que también usa el navegador (el formulario de /regalar).
// Sin imports de Node: regalo.ts usa node:crypto y no puede bajar al cliente.
// regalo.ts las re-exporta, así que el servidor las sigue importando de ahí.

export const GENEROS = ["varon", "mujer", "otro"] as const;
export type Genero = (typeof GENEROS)[number];
export const MENSAJE_MAXIMO = 600;
