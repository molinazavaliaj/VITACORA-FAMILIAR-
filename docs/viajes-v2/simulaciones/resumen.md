# Vitácora de Viaje V2 · Simulaciones

Generado por `fabrica/scripts/viaje-v2-simular.ts` (no editar a mano): **2400 viajes inventados** corridos de punta a punta con el código de `fabrica/src/viaje-v2/`, semillas 1 a 2400. Cualquier viaje se repite con `npx tsx scripts/viaje-v2-simular.ts --semilla N`.

## Qué varía
- Duración: 1, 2, 3, 4, 7, 15, 30 y 60 días, y al azar (1 a 45). Rotan con la semilla, parejo.
- Compra: el mismo día que sale, 1, 3 o 20 días antes, a cualquier hora entre las 8 y las 23.
- Casa en Buenos Aires, Madrid o Ciudad de México; viaje en Madrid, Tokio, Buenos Aires o Nueva York. Un 35% cae sobre un cambio de horario (Europa 25/10/2026 y 28/3/2027; EE. UU. 1/11/2026 y 14/3/2027).
- Noche: 21:30, 20:00, 22:59, 23:30, 07:00 o sin elegir. Regalo o para uno; 0 a 5 propias; PDF o impreso; álbum de 20 o 40.
- Conducta: contesta todo · no contesta nunca · al azar · "paso" seguido · escribe · audios cortados · se saltea noches seguidas · manda fotos sueltas.
- Álbum: 0 fotos · pocas · justas · de más · de a tandas con pausas de 6 a 30 horas. Al AL2: sí, no, más fotos o silencio.

## Decisiones del simulador (el planificador todavía no existe)
- BIEN-1 sale al comprar (corrido a las 8:00 si cae en la franja). La persona siempre dice SÍ (a veces 8 a 26 horas después).
- Lo programado que ya pasó cuando dice SÍ no sale ("vencido"; ver i5).
- El calendario definitivo se arma justo antes de ID1 (o IV1), con lo que quedó pendiente de antes de salir. La persona contesta cada pregunta antes de que llegue la siguiente.
- Mensajes "por reloj" (los que revisa la invariante a): todo lo programado, BIEN-1, REC1, AL2 y DES por reloj o por Naza, y las de la cadena. Las reacciones inmediatas (acuses, COR, AL1, DES con "listo") no.
- Naza cierra un álbum con cero fotos al día siguiente del aviso, a las 12:00 (hora de casa).

## Invariantes

| Invariante | Viajes que la rompen | Ejemplo más chico |
|---|---|---|
| a) Mensaje por reloj (o de la cadena) entre las 23:00 y las 8:00 locales | 0 de 2400 | — |
| b) Más de 2 preguntas en un mismo día | 0 de 2400 | — |
| b) El día de salida llega algo más que UC1 | 0 de 2400 | — |
| b) El día de vuelta llega algo más que VU0 | 303 de 2400 | semilla 299: 3 días (2027-03-19 → 2027-03-21) · compra el mismo día a las 16:24 · CDMX → Madrid · noche 23:30 · para uno · 1 propias · pdf, álbum de 40 · conducta nunca, álbum tandas. **2027-03-21: FN1, VU0** |
| c) Marca {{…}} sin completar | 0 de 2400 | — |
| c) Texto que no sale del banco | 0 de 2400 | — |
| d) "Hasta la noche" sin noche más tarde ese día | 0 de 2400 | — |
| d) "Mañana hay otra" con otra ese día, o sin otra al día siguiente | 32 de 2400 | semilla 1818: 1 día (2027-03-14 → 2027-03-14) · compra 20 días antes a las 10:41 · Buenos Aires → Madrid · noche 07:00 · regalo · 5 propias · pdf, álbum de 40 · conducta azar, álbum cero · cruza cambio de hora. **PAS-V 2027-03-15 10:45 Buenos Aires y al otro día no llega nada** |
| d) PAS-A ("Seguimos con la próxima") sin próxima | 0 de 2400 | — |
| d) "Lo escuché" después de un texto | 0 de 2400 | — |
| d) ATR arriba de algo que no es la noche común | 0 de 2400 | — |
| d) Versión "ya de viaje" antes de salir, o la normal ya de viaje | 71 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **AS1 versión normal el 2026-10-26 01:26 Buenos Aires (ya de viaje)** |
| d) "Ayer" (ID1) fuera del día siguiente a la salida | 0 de 2400 | — |
| e) Una de antes de salir sale dos veces (misma versión), o "ya de viaje" después de contestada | 0 de 2400 | — |
| e) Una de antes de salir no contestada, que no sale ni queda en avisosNaza | 0 de 2400 | — |
| e) Una pregunta propia sale dos veces | 0 de 2400 | — |
| e) Una pregunta propia que no sale ni queda en avisosNaza | 0 de 2400 | — |
| f) Mediodía fuera de orden, fuera de la segunda vuelta o en un día que no va | 0 de 2400 | — |
| f) Choque MD2/NO1 o MD8/NO6 el mismo día | 0 de 2400 | — |
| f) Mismo comienzo, puerta o cierre dos noches comunes seguidas | 0 de 2400 | — |
| g) TXT más de 2 veces | 0 de 2400 | — |
| g) REC1/REC1-U más de 1 vez | 0 de 2400 | — |
| g) AL2 más de 2 veces | 0 de 2400 | — |
| g) DES no sale exactamente 1 vez con el álbum cerrado (o sale sin cerrar) | 0 de 2400 | — |
| g) Álbum con 0 fotos: sin aviso a Naza, o DES sin esperar su decisión | 0 de 2400 | — |
| h) El calendario no está en orden creciente de tiempo | 377 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **IV1 (día 1, 2026-10-26 10:00) antes que CA1 (día 1, 2026-10-26 08:00)** |
| h) Algún mensaje después de DES | 9 de 2400 | semilla 919: 2 días (2026-10-31 → 2026-11-01) · compra 20 días antes a las 12:08 · Buenos Aires → Nueva York · noche 07:00 · para uno · 5 propias · pdf, álbum de 20 · conducta saltea, álbum justas · cruza cambio de hora. **ACM1 2026-11-02 13:57 Buenos Aires después de DES** |
| h) Otra pregunta entre AL1 y DES | 146 de 2400 | semilla 1602: 1 día (2026-11-01 → 2026-11-01) · compra 1 día antes a las 12:38 · CDMX → Buenos Aires · noche 07:00 · para uno · 5 propias · pdf, álbum de 40 · conducta azar, álbum justas · cruza cambio de hora. **IV1 2026-11-02 10:00 CDMX entre AL1 y DES** |
| El código tira un error (el viaje no termina) | 0 de 2400 | — |

## Hallazgos (no son invariantes pedidas, pero conviene mirarlos)

| Hallazgo | Viajes | Ejemplo más chico |
|---|---|---|
| ID1 ("Ayer fue el día del viaje") llega el mismo día de salida en hora de casa | 316 de 2400 | semilla 442: 2 días (2027-04-20 → 2027-04-21) · compra el mismo día a las 11:16 · CDMX → Tokio · noche 21:30 (por defecto) · para uno · 0 propias · impreso, álbum de 20 · conducta nunca, álbum pocas. **ID1 2027-04-21 10:00 Tokio = 19:00 en casa, el día de salida** |
| "Lo escuché" (ACN3/ACA2) después de una respuesta que fue solo una foto | 82 de 2400 | semilla 666: 1 día (2027-03-28 → 2027-03-28) · compra 20 días antes a las 10:28 · CDMX → Nueva York · noche 21:30 · regalo · 4 propias · pdf, álbum de 20 · conducta azar, álbum tandas · cruza cambio de hora. **ACA2+AS2 después de cadena** |
| Una noche común ("cómo fue hoy", "ya terminó el día") sale antes de las 12:00 | 350 de 2400 | semilla 1934: 4 días (2027-02-05 → 2027-02-08) · compra 20 días antes a las 11:38 · CDMX → Tokio · noche 23:30 · para uno · 0 propias · impreso, álbum de 20 · conducta saltea, álbum pocas. **C1+NO1+F1 2027-02-07 08:00 Tokio** |
| FN1 ("Mañana te volvés") no sale la víspera de la vuelta | 303 de 2400 | semilla 299: 3 días (2027-03-19 → 2027-03-21) · compra el mismo día a las 16:24 · CDMX → Madrid · noche 23:30 · para uno · 1 propias · pdf, álbum de 40 · conducta nunca, álbum tandas. **FN1 2027-03-21 08:00 Madrid (vuelta 2027-03-21)** |
| Algo programado ya pasó cuando dice SÍ y no sale nunca (UC1, VU0; si el SÍ llega muy tarde, también ID1 y noches) | 595 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **UC1 (2026-10-25 10:00) vence: SÍ a las 01:26** |
| AS1 (versión normal) llega el día de salida, con el SÍ (documentado en alDecirSi) | 659 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **AS1 el 2026-10-26 01:26 Buenos Aires** |
| CA1 sin respuesta: no se abre el álbum y no hay DES (la entrevista queda abierta) | 739 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **CA1 sin respuesta** |
| Fotos del álbum que llegan después de cerrado | 302 de 2400 | semilla 333: 1 día (2027-02-24 → 2027-02-24) · compra el mismo día a las 22:13 · CDMX → Tokio · noche 21:30 · para uno · 1 propias · impreso, álbum de 20 · conducta cortados, álbum tandas. **27 fotos** |
| Una de antes de salir mandada y sin respuesta vuelve "ya de viaje" (por diseño) | 923 de 2400 | semilla 1596: 4 días (2026-10-30 → 2026-11-02) · compra el mismo día a las 13:28 · CDMX → Nueva York · noche 07:00 · regalo · 3 propias · impreso, álbum de 40 · conducta nunca, álbum justas · cruza cambio de hora. **AS1** |
| Una reacción con pregunta adentro (AS1 con el SÍ, o COR) sale entre las 23:00 y las 8:00 | 283 de 2400 | semilla 153: 1 día (2026-10-25 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 07:00 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **AS1 a las 2026-10-26 01:26 Buenos Aires** |
| AL2 o DES por reloj a las 8:00 justas (el reloj cayó en la franja) | 351 de 2400 | semilla 486: 1 día (2027-01-24 → 2027-01-24) · compra el mismo día a las 21:10 · Buenos Aires → Buenos Aires · noche 23:30 · para uno · 5 propias · pdf, álbum de 40 · conducta saltea, álbum pocas. **DES 2027-01-27 08:00 Buenos Aires** |

## Mensajes que le llegan, por duración

Mensajes de Vitácora (todo lo que sale, acuses incluidos). "Por día": total dividido por los días de calendario entre el primer y el último mensaje; "máx. en un día": el día más cargado (fecha local de cada mensaje).

| Días | Viajes | Total (prom.) | Total (máx.) | Por día (prom.) | Máx. en un día | Preguntas por día de viaje (prom.) |
|---|---|---|---|---|---|---|
| 1 | 272 | 11,9 | 22 | 2,3 | 7 | 1,8 |
| 2 | 275 | 14,5 | 23 | 2,2 | 8 | 1,6 |
| 3 | 271 | 16,8 | 27 | 2,0 | 8 | 1,4 |
| 4 | 275 | 20,5 | 35 | 2,3 | 9 | 1,5 |
| 7 | 272 | 32,3 | 50 | 2,6 | 9 | 1,7 |
| 15 | 276 | 63,3 | 99 | 3,1 | 9 | 1,9 |
| 30 | 274 | 122,1 | 190 | 3,3 | 10 | 1,9 |
| 60 | 266 | 239,5 | 370 | 3,6 | 10 | 2,0 |
| otras (1-45) | 219 | 109,5 | 269 | 3,3 | 10 | 1,9 |

## Cuántas veces se repite cada texto en un viaje de 30 días

239 viajes de 30 días (sin contar la conducta "no contesta nunca"). Veces que sale cada ID en un mismo viaje.

| ID | Promedio por viaje | Máximo |
|---|---|---|
| ACM1 | 12,1 | 46 |
| ACM2 | 11,8 | 46 |
| C3 | 7,8 | 9 |
| F2 | 7,6 | 9 |
| C1 | 7,4 | 9 |
| F3 | 7,4 | 9 |
| F1 | 7,4 | 9 |
| C2 | 7,1 | 9 |
| ACM3 | 5,6 | 23 |
| ACN1 | 5,6 | 10 |
| ACN2 | 5,4 | 9 |
| ACN4 | 5,0 | 9 |
| ACM4 | 4,9 | 22 |
| MD1 | 4,1 | 5 |
| MD3 | 4,0 | 4 |
| MD4 | 4,0 | 4 |
| MD5 | 4,0 | 4 |
| MD6 | 4,0 | 4 |
| ACN3 | 3,9 | 7 |
| COR | 3,8 | 37 |
| PAS-V2 | 3,7 | 34 |
| NO1 | 3,0 | 3 |
| NO2 | 2,9 | 3 |
| NO4 | 2,8 | 3 |
| NO3 | 2,7 | 3 |
| NO9 | 2,4 | 3 |
| NO8 | 2,3 | 3 |
| NO5 | 2,2 | 3 |
| NO7 | 2,1 | 3 |
| PAS-V | 2,1 | 22 |
| NO6 | 2,1 | 3 |
| ATR-V | 1,9 | 12 |
| AS1 | 1,3 | 2 |
| PR-P | 1,3 | 5 |
| PR-R | 1,1 | 5 |
| VA1 | 1,1 | 2 |
| AS2 | 1,1 | 2 |
| IM1 | 1,0 | 2 |
| ATR1 | 0,8 | 3 |
| ATR2 | 0,6 | 3 |
| TXT | 0,5 | 2 |
| AL2 | 0,5 | 2 |
| ATR3 | 0,4 | 2 |
| PAS-A | 0,1 | 3 |

Preguntas enteras idénticas (el mismo texto, letra por letra) en un viaje de 30 días: como mucho 5 veces el mismo (promedio del peor por viaje: 4,1).

## Cuántas veces se repite cada texto en un viaje de 60 días

232 viajes de 60 días (sin contar la conducta "no contesta nunca"). Veces que sale cada ID en un mismo viaje.

| ID | Promedio por viaje | Máximo |
|---|---|---|
| ACM1 | 24,1 | 90 |
| ACM2 | 23,8 | 89 |
| F2 | 17,7 | 19 |
| C3 | 17,7 | 19 |
| C1 | 17,5 | 19 |
| F3 | 17,4 | 19 |
| F1 | 17,3 | 19 |
| C2 | 17,2 | 19 |
| ACN1 | 11,6 | 20 |
| ACN2 | 11,3 | 19 |
| ACN4 | 10,8 | 19 |
| ACM3 | 10,7 | 47 |
| MD1 | 10,2 | 11 |
| MD3 | 10,0 | 10 |
| MD4 | 10,0 | 10 |
| MD5 | 10,0 | 10 |
| MD6 | 10,0 | 10 |
| ACM4 | 9,5 | 42 |
| ACN3 | 8,1 | 14 |
| COR | 7,7 | 63 |
| PAS-V2 | 7,3 | 65 |
| NO1 | 6,2 | 7 |
| NO2 | 6,1 | 7 |
| NO4 | 6,0 | 7 |
| NO3 | 6,0 | 6 |
| NO9 | 5,9 | 6 |
| NO8 | 5,8 | 6 |
| NO5 | 5,7 | 6 |
| NO7 | 5,5 | 6 |
| NO6 | 5,3 | 6 |
| ATR-V | 4,4 | 24 |
| PAS-V | 4,3 | 43 |
| ATR1 | 1,4 | 6 |
| AS1 | 1,3 | 2 |
| PR-R | 1,3 | 5 |
| ATR2 | 1,3 | 5 |
| PR-P | 1,2 | 5 |
| ATR3 | 1,1 | 5 |
| IM1 | 1,1 | 2 |
| AS2 | 1,1 | 2 |
| VA1 | 1,1 | 2 |
| TXT | 0,6 | 2 |
| AL2 | 0,4 | 2 |
| PAS-A | 0,2 | 3 |

Preguntas enteras idénticas (el mismo texto, letra por letra) en un viaje de 60 días: como mucho 11 veces el mismo (promedio del peor por viaje: 10,2).

## Cuánto tarda en cerrarse el álbum

Desde AL1 hasta DES, en horas.

| Álbum | Viajes con álbum abierto | Cerrados | Promedio | Máximo | AL2 por viaje (prom.) |
|---|---|---|---|---|---|
| cero | 349 | 349 | 33,1 | 39,8 | 0,0 |
| pocas | 353 | 353 | 13,1 | 46,0 | 0,6 |
| justas | 343 | 343 | 11,4 | 38,0 | 0,4 |
| demas | 312 | 312 | 13,3 | 39,6 | 0,6 |
| tandas | 304 | 304 | 22,4 | 51,2 | 1,4 |
| todos | 1661 | 1661 | 18,7 | 51,2 | 0,6 |

739 viajes no abren el álbum (CA1 sin respuesta o "no contesta nunca"): no hay AL1 ni DES.
