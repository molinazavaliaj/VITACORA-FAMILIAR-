# Viaje V2 · Paso 2, parte 2: las noches, ronda 4 (30/09/2026)

## Decisión de Naza (sobre la ronda 3)
Aclaró que V3 no se toca (verificado: `viajes-v2` solo tiene archivos nuevos en `docs/viajes-v2/`; el worktree de V3 sigue igual que `origin/v3`). Eligió probar **"juntas"**: un solo mensaje por noche con **comienzo abierto** (rota) + **puerta** (rota) + **cierre** (rota).

## Lo que trajo Fable

### Comienzos
- **C1:** Contame cómo fue hoy, {{nombre}}, como se lo contarías a alguien que te quiere y no estuvo.
- **C2:** Ya terminó el día. Contámelo como si alguien de casa te llamara ahora mismo a preguntarte cómo te fue.
- **C3:** ¿Cómo fue hoy, {{nombre}}? Contámelo como se lo contarías en la mesa cuando vuelvas, con lo que valga la pena.
- **C4 (Fable la saca):** Cerrá el día contándomelo, como si me lo estuvieras contando a mí, que no estuve y quiero saber todo. ("Quiero saber todo" empuja al inventario, y "a mí" mete al biógrafo como persona.)

### Puertas
| ID | Puerta |
|---|---|
| NO1 | Arrancá por algo que comiste |
| NO2 | Arrancá por un lugar donde te quedaste un rato |
| NO3 | Arrancá por algo que viste hoy y que allá donde vivís sería raro |
| NO4 | Arrancá por el momento en que más sentiste que estabas de viaje |
| NO5 | Arrancá por alguien que te cruzaste y no conocías |
| NO6 | Arrancá por algo que no estaba en el plan |
| NO7 | Arrancá por un rato en que no estabas haciendo nada |
| NO8 | Arrancá por el momento en que el cuerpo te avisó algo, cansancio o hambre, lo que fuera |
| NO9 | Arrancá por algo que te hizo reír, aunque sea una tontería |
| NO10 | (a) **Sacarla (Fable elige):** la llegada cae sola en NO2 o NO4 el día que pasa, y una puerta con condición se lee a formulario. (b) Si va: Arrancá por lo primero que viste al llegar a algún lado hoy, aunque haya sido el hotel de siempre. |

### Cierres
- **F1:** …y de ahí seguí por donde quieras. Mandá las fotos que quieras que queden.
- **F2:** …y después seguí con lo que venga. Si hay fotos, mandalas.
- **F3:** …y de ahí andá por donde te lleve el día. Las fotos que quieras guardar, mandámelas.

### Tres mensajes completos
- C1 + NO5 + F1: Contame cómo fue hoy, {{nombre}}, como se lo contarías a alguien que te quiere y no estuvo. Arrancá por alguien que te cruzaste y no conocías, y de ahí seguí por donde quieras. Mandá las fotos que quieras que queden.
- C2 + NO7 + F2: Ya terminó el día. Contámelo como si alguien de casa te llamara ahora mismo a preguntarte cómo te fue. Arrancá por un rato en que no estabas haciendo nada, y después seguí con lo que venga. Si hay fotos, mandalas.
- C3 + NO3 + F3: ¿Cómo fue hoy, {{nombre}}? Contámelo como se lo contarías en la mesa cuando vuelvas, con lo que valga la pena. Arrancá por algo que viste hoy y que allá donde vivís sería raro, y de ahí andá por donde te lleve el día. Las fotos que quieras guardar, mandámelas.

Nota para el código (Fable): la puerta termina sin punto y el cierre empieza con ", y…".

## Control (Claude)
- Ok con las reglas. C2 ("alguien de casa te llamara") no da nada por hecho: es un "como si".
- Las puertas cortas pierden el "primer bocado" y los detalles de la ronda 1; ese detalle ahora lo pone la persona. Es el precio de abrir al día entero.
