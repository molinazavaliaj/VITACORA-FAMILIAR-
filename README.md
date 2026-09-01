# Vitácora Familiar

En 30 días de entrevistas por WhatsApp, el libro y el audiolibro de la vida de tu familiar, contados con su propia voz.

## Estructura (propiedad por carpeta)

| Carpeta | Dueño | Qué es |
|---|---|---|
| `entrevistador/` | Socio 1 (Argentina) | Servicio Node/TS: WhatsApp + cerebro IA. Deploy: Railway. |
| `web/` | Socio 2 (Naza, Barcelona) | Next.js: registro, tablero, saludos, pagos. Deploy: Vercel. |
| `fabrica/` | Socio 2 (Naza) | Worker Node: genera libro y audiolibro. Deploy: Railway. |
| `supabase/` | Compartida — avisar antes de tocar | Migraciones y contrato de datos. Leer `supabase/CONTRATO.md`. |
| `docs/` | Compartida | Spec de diseño y planes de implementación. |

**Regla de oro:** nadie toca la carpeta del otro. Los servicios se comunican SOLO por la base de datos.

- Spec completo: `docs/superpowers/specs/2026-09-01-vitacora-familiar-design.md`
- Planes: `docs/superpowers/plans/`
- Onboarding del socio 1: `ONBOARDING-SOCIO.md`
