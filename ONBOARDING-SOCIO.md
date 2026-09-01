# Arranque para el Socio 1 (Argentina) y su Claude

Bienvenido. Este repo ya tiene el diseño aprobado y los planes de implementación escritos. Tu módulo es el **Servicio Entrevistador** (`entrevistador/`): el bot de WhatsApp con el cerebro IA. Naza construye en paralelo `web/` y `fabrica/`. No se tocan: se comunican solo por la base de datos.

## Paso 1 — Tener el repo

1. Instalar [Claude Code](https://claude.com/claude-code) si no lo tenés.
2. Clonar este repo (Naza te pasa el link de GitHub) y abrir Claude Code en la carpeta.
3. Si podés, instalá el plugin **superpowers** de Claude Code (los planes lo aprovechan); si no, los planes se siguen igual tarea por tarea.

## Paso 2 — Leer (en este orden)

1. `docs/superpowers/specs/2026-09-01-vitacora-familiar-design.md` — el diseño completo del producto.
2. `supabase/CONTRATO.md` — qué tablas escribís vos y cuáles solo leés. **La regla de oro del proyecto.**
3. `docs/superpowers/plans/2026-09-01-plan-a-entrevistador.md` — tu plan, tarea por tarea.

## Paso 3 — Claves que necesitás (pedirle a Naza las compartidas)

| Variable | De dónde sale |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Compartidas — las pasa Naza (proyecto único de Supabase). |
| `ANTHROPIC_API_KEY` | Tu cuenta de [console.anthropic.com](https://console.anthropic.com) (o una compartida del proyecto). |
| `OPENAI_API_KEY` | Cuenta de OpenAI (Whisper + voz del entrevistador). |
| `WA_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_VERIFY_TOKEN` | Meta for Developers → app de WhatsApp Business (ver abajo). |

**Trámite lento — arrancarlo YA, en paralelo al código:** crear la app de WhatsApp Business en [developers.facebook.com](https://developers.facebook.com), verificar el negocio en Meta Business Manager, y cargar las 3 plantillas de `entrevistador/PLANTILLAS.md` (se crean en la Task 11 del plan, pero podés leerlas ahí desde el día uno). La aprobación de plantillas tarda de horas a días. Mientras tanto, el número de prueba que da Meta sirve para desarrollar.

## Paso 4 — El primer mensaje para tu Claude

Pegale esto tal cual:

> Lee docs/superpowers/specs/2026-09-01-vitacora-familiar-design.md, supabase/CONTRATO.md y docs/superpowers/plans/2026-09-01-plan-a-entrevistador.md. Mi módulo es exclusivamente la carpeta entrevistador/ — jamás toques web/, fabrica/ ni supabase/ (si un cambio de esquema parece necesario, frená y avisame para coordinarlo con mi socio). Ejecutá el plan A tarea por tarea con la skill de executing-plans (o subagent-driven-development), respetando el TDD de cada tarea. Antes de arrancar, verificá con la base que el Plan 0 ya fue ejecutado (las 7 tablas existen).

## Reglas de convivencia entre los dos Claude

- **Pull antes de cada sesión, push al final de cada sesión.** Commits chicos y frecuentes (los planes ya los marcan).
- **Nadie toca la carpeta del otro.** Ni "un fix chiquito". Si ves algo roto del otro lado, se avisa por Discord.
- **Cambios de esquema:** primero se conversa entre socios, después se edita `supabase/CONTRATO.md` + nueva migración en `supabase/migrations/`, y el que lo hizo avisa para que el otro regenere tipos.
- Las **25 preguntas definitivas** salen de una sesión de brainstorming pendiente (la hacemos juntos en Discord); hasta entonces el seed trae 3 provisionales y tu desarrollo no se bloquea: todo el flujo funciona igual con 3 que con 25.
