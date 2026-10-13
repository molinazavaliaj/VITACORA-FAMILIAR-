# Mediciones

Lighthouse 12.8.2, móvil simulado (Moto G Power, 4G lenta), solo «Performance», 3 corridas por
página desde la máquina de Naza; se apunta la mediana. TBT varía mucho entre corridas porque
depende de la CPU local: mirar LCP, CLS y peso.

## Fase 0 — 13/10/2026

| Página | Dónde | Perf | LCP | CLS | TBT | JS (transfer) | Peso total |
|---|---|---|---|---|---|---|---|
| `/` | producción (antes) | 90 | 3,10 s | 0 | 212 ms | 144 kB | 415 kB |
| `/` | preview fase 0 | 82* | **2,41 s** | 0 | 390 ms* | 144 kB | 414 kB |
| `/comprar` | producción | 87 | 3,12 s | 0 | 302 ms | 151 kB | 395 kB |
| `/comprar` | preview fase 0 | 94 | **2,52 s** | 0 | 197 ms | 151 kB | **305 kB** |
| `/entrar` | producción | 96 | 2,31 s | 0 | 158 ms | 207 kB | 232 kB |
| `/entrar` | preview fase 0 | 93 | **1,72 s** | 0 | 303 ms* | 207 kB | 236 kB |
| `/viaje` | producción | 91 | 3,04 s | 0 | 203 ms | 140 kB | 392 kB |
| `/viaje` | preview fase 0 | 94 | **2,74 s** | 0 | 194 ms | 140 kB | **341 kB** |

\* TBT ruidoso (CPU local); el LCP y el peso son los que cuentan.

Notas:
- Con las tipografías en el layout raíz y preload, `/entrar` pasaba a 448 kB y LCP 3,37 s (bajaba
  5 woff2 que no usa). Se quitó el preload: cada página baja solo las letras que pinta.
- El LCP de `/` es el titular (`h1`, Playfair). El objetivo < 2,0 s es de la fase 1 (portada
  nueva, estática).
- Panel (`/tablero`, `/tablero/[id]`): Lighthouse no entra sin sesión. Viajes a Supabase en serie,
  contados en el código: `/tablero/[id]` V3 en marcha 16–27 → 6–8; `/tablero` 13–21 → 5–8;
  subpáginas con riel 14–23 → 4–6; `/comprar` y `/entrar` con cookie 1 → 0. Falta medirlo con
  una sesión real y la región de Supabase (B16): las funciones de Vercel corren en `iad1`.
