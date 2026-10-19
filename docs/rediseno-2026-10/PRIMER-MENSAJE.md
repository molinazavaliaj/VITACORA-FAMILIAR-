# Primer mensaje para Claude Code

Antes: deja el archivo `rediseno-2026-10.zip` en la carpeta raíz del repositorio (donde está `README.md`).
Luego abre Claude Code en esa carpeta y pega esto tal cual:

---

Vamos a implementar el rediseño de la web de Vitácora.

1. Crea la rama `rediseno-web` desde `main`. No toques `main` hasta que yo te diga que hacemos el switch.
2. Descomprime `rediseno-2026-10.zip` en `docs/rediseno-2026-10/`, borra el zip y haz un primer commit
   en la rama solo con esa carpeta.
3. Antes de tocar código, lee enteros y en este orden: `docs/rediseno-2026-10/DECISIONES.md` (manda sobre
   todo lo demás), `PASO-DE-MANOS.md`, `RENDIMIENTO.md`, `MOTION.md`, `TEXTOS-Y-REGLAS.md` y `PENDIENTES.md`.
   Las maquetas están en `docs/rediseno-2026-10/maquetas/`: empieza por `fuente-dc/Guia.dc.html` y
   `fuente-dc/Motion.dc.html`, y mira las capturas de `capturas/`.

Reglas que no se negocian:
- Trabaja solo en `web/`. No toques `entrevistador/`, `fabrica/` ni `supabase/`. Si algo necesita un
  campo nuevo en la base, no lo inventes: apúntalo en `PENDIENTES.md` y sigue sin él.
- No borres ninguna ruta ni función que exista hoy; lo que la maqueta no cubre se re-viste con el
  sistema visual nuevo.
- Precios siempre desde `web/src/lib/precios.ts` y `productos.ts`. Textos desde diccionarios por idioma
  (castellano de España, catalán y la variante de Argentina con vos). Nada de ejemplo (reseñas,
  personas generadas, cita de IFEMA) se publica, y ninguna promesa que el sistema no cumpla hoy.
- El rendimiento es el norte: cumple los objetivos de `RENDIMIENTO.md` en cada fase.
- `cd web && npm test` en verde antes de cada push.

Empieza por la fase 0. Antes, dime en una lista corta qué necesitas de mí (Vercel: variables del
entorno Preview, claves de pago de prueba, regiones; y cualquier decisión de `PENDIENTES.md` que te
frene). Al terminar cada fase: tests en verde, push, espera a que se publique la versión de prueba,
pásame la URL, las capturas comparadas con las maquetas y las métricas de velocidad, y **para**.
No empieces la fase siguiente sin mi OK.

---
