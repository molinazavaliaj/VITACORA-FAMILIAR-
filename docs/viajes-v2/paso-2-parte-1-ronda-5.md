# Viaje V2 · Paso 2, parte 1, ronda 5 (30/09/2026)

## Decisiones de Naza (sobre la ronda 4)
- **Aprobadas:** ID1 (H2 limpia), IM1 A, el orden, y los arreglos del control (IM1 abierta a varios destinos y su variante sin "Todavía no llegaste", UC1 sin "última mirada", ID1 en pasado a la mañana si salió de noche).
- **VA1:** no la nombró; se toma la A (la que eligió Fable) por su "está bien en todas". Confirmar.
- **UC1:** "Si le dice que hoy es el día, ¿por qué le pregunta cómo fue cuando cerró la puerta? Que se formule bien para el momento en que se pregunta."

## Lo que trajo Fable

### UC1 · el último rato en casa (mañana del día de salida, en presente)
- **A (Fable elige):** Hoy es el día, {{nombre}}. Antes de cerrar la puerta, contame cómo es este último rato en casa: qué estás haciendo ahora mismo, qué queda dando vueltas.
- **B:** Hoy te vas, {{nombre}}. Mandame un audio desde casa, antes de salir: qué estás haciendo en este momento y cómo se siente la casa un rato antes de irte.
- Versión en pasado, para quien ya salió de madrugada: Hoy es el día, {{nombre}}. Contame cómo fue el último rato en casa, justo antes de cerrar la puerta: qué estabas haciendo, qué quedó dando vueltas.

### IM1 · abierta a varios destinos
- **Texto:** Antes de conocerlo, ¿cómo te imaginás el lugar adonde vas, o el primero, si son varios? No lo que leíste ni lo que hay que ver: la imagen que se te aparece cuando pensás en estar ahí, aunque sea una calle o un olor. Contame esa imagen y de dónde te viene.
- **Ya de viaje:** Pensá en cómo te imaginabas el lugar adonde ibas, o el primero, si son varios, antes de salir. No lo que habías leído ni lo que había que ver: la imagen que se te aparecía cuando pensabas en estar ahí, aunque fuera una calle o un olor. Contame esa imagen y de dónde te venía.

### ID1 · la mañana siguiente, en pasado
Ayer fue el día del viaje, {{nombre}}. No me cuentes horarios: contame un rato del camino en el que no estabas haciendo nada, solo yendo, y te diste cuenta de que ya estabas lejos. Qué había del otro lado de la ventanilla y qué pensabas.

## Control de reglas (Claude)
- **UC1 en pasado:** el código no puede saber si ya salió (solo sabe la fecha). **Se cambia:** queda solo la versión en presente; la de pasado se guarda en el registro y no se usa.
- **ID1 en pasado:** el código tampoco sabe si salió de noche; solo sabe que no contestó. **Se cambia:** la regla queda "si a la mañana siguiente ID1 sigue sin respuesta, se reenvía en pasado". Se cierra en el paso 3 (el flujo).
