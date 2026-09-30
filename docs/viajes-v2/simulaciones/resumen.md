# Vitácora de Viaje V2 · Simulaciones

Generado por `fabrica/scripts/viaje-v2-simular.ts` (no editar a mano): **2400 viajes inventados** corridos de punta a punta con el código de `fabrica/src/viaje-v2/`, semillas 1 a 2400. Cualquier viaje se repite con `npx tsx scripts/viaje-v2-simular.ts --semilla N`.

## Qué varía
- Duración: 3, 4, 5, 7, 10, 15, 30 y 60 días, y al azar (3 a 45). Rotan con la semilla, parejo. (La compra pide al menos 3 días; las escapadas de 1 y 2 días quedan en sus lecturas.)
- Compra: el mismo día que sale, 1, 3 o 20 días antes, a cualquier hora entre las 8 y las 23.
- Casa en Buenos Aires, Madrid o Ciudad de México; viaje en Madrid, Tokio, Buenos Aires o Nueva York. Un 35% cae sobre un cambio de horario (Europa 25/10/2026 y 28/3/2027; EE. UU. 1/11/2026 y 14/3/2027).
- Noche: 21:30, 20:00, 19:00, 22:30 o sin elegir (la compra pide entre 19:00 y 22:30). Regalo o para uno; 0 a 5 propias; PDF o impreso; álbum de 20 o 40.
- Conducta: contesta todo · no contesta nunca · al azar · "paso" seguido · escribe · audios cortados · se saltea noches seguidas · manda fotos sueltas.
- Álbum: 0 fotos · pocas · justas · de más · de a tandas con pausas de 6 a 30 horas. Al AL2: sí, no, más fotos o silencio. Al AL3: reenvía las que sobran, reenvía menos, contesta otra cosa o nada.

## Decisiones del simulador (el planificador todavía no existe)
- BIEN-1 sale al comprar (corrido a las 8:00 si cae en la franja). La persona siempre dice SÍ (a veces 8 a 26 horas después).
- Con un SÍ tardío el día de salida, UC1 sale 2 horas después (i13); lo demás programado que ya pasó cuando dice SÍ no sale ("vencido"; ver i5). Un SÍ después del día de salida trae AS1 "ya de viaje".
- CA1 sin respuesta: al día siguiente a las 13:00 sale AL1-P igual (i7).
- El calendario definitivo se arma justo antes de ID1 (o IV1), con lo que quedó pendiente de antes de salir. La persona contesta cada pregunta antes de que llegue la siguiente.
- Mensajes "por reloj" (los que revisa la invariante a): todo lo programado, BIEN-1, REC1, AL1-P sin CA1, AL2, AL3 y DES por reloj o por Naza, y las de la cadena. Las reacciones inmediatas (acuses, COR, AL1, DES con "listo") no.
- Las reacciones ❤️ (mediodía, VU0, fotos sueltas) no son mensajes: no cuentan en los totales y van en su propia columna.
- Naza cierra un álbum con cero fotos al día siguiente del aviso, a las 12:00 (hora de casa).

## Invariantes

| Invariante | Viajes que la rompen | Ejemplo más chico |
|---|---|---|
| a) Mensaje por reloj (o de la cadena) entre las 23:00 y las 8:00 locales | 0 de 2400 | — |
| b) Más de 2 preguntas en un mismo día | 0 de 2400 | — |
| b) El día de salida llega algo más que UC1 | 0 de 2400 | — |
| b) El día de vuelta llega algo más que VU0 | 0 de 2400 | — |
| c) Marca {{…}} sin completar | 0 de 2400 | — |
| c) Texto que no sale del banco | 0 de 2400 | — |
| d) "Hasta la noche" sin noche más tarde ese día | 0 de 2400 | — |
| d) "Mañana hay otra" con otra ese día, o sin otra al día siguiente | 0 de 2400 | — |
| d) PAS-A ("Seguimos con la próxima") sin próxima | 0 de 2400 | — |
| d) "Lo escuché" (ACA2/ACN3) después de una respuesta que fue solo texto o solo fotos | 0 de 2400 | — |
| d) ATR arriba de algo que no es la noche común | 0 de 2400 | — |
| d) Versión "ya de viaje" antes de salir, o la normal ya de viaje | 0 de 2400 | — |
| d) "Ayer" (ID1) fuera del día siguiente a la salida | 0 de 2400 | — |
| d) ATR-V dos noches seguidas | 0 de 2400 | — |
| d) Acuse en texto (ACM) al mediodía, a VU0 o a una foto suelta (va la reacción ❤️), una respuesta o foto suelta sin su ❤️, o una ❤️ que apunta a otro mensaje | 0 de 2400 | — |
| d) ID1 el mismo día de salida en hora de casa | 0 de 2400 | — |
| d) PAS-V2 ("esta la salteamos") sin otra pregunta ese día, o PAS-V ("Mañana hay otra") con otra ese día | 0 de 2400 | — |
| d) ID1 después de la noche del día 1 (con 12 h o más de diferencia, ID1 ocupa esa noche) | 0 de 2400 | — |
| e) Una de antes de salir sale dos veces (misma versión), o "ya de viaje" después de contestada | 0 de 2400 | — |
| e) Una de antes de salir no contestada, que no sale ni queda en avisosNaza | 0 de 2400 | — |
| e) Una pregunta propia sale dos veces | 0 de 2400 | — |
| e) Una pregunta propia que no sale ni queda en avisosNaza | 0 de 2400 | — |
| e) Dos preguntas propias de regalo seguidas con el mismo envoltorio (PR-R, PR-R2, PR-R3) | 0 de 2400 | — |
| f) Mediodía fuera de orden (las 12 en cada vuelta) o en un día que no va | 0 de 2400 | — |
| f) Choque MD2/NO1 o MD8/NO6 el mismo día | 0 de 2400 | — |
| f) Mismo comienzo, puerta o cierre dos noches comunes seguidas | 0 de 2400 | — |
| g) TXT más de 2 veces | 0 de 2400 | — |
| g) REC1/REC1-U más de 1 vez | 0 de 2400 | — |
| g) AL2 más de 2 veces | 0 de 2400 | — |
| g) DES no sale exactamente 1 vez con el álbum cerrado (o sale sin cerrar) | 0 de 2400 | — |
| g) Álbum con 0 fotos: sin aviso a Naza, o DES sin esperar su decisión | 0 de 2400 | — |
| g) TXT pegado a otra cosa en el mismo mensaje | 0 de 2400 | — |
| g) El viaje termina sin DES (el álbum nunca se cierra) | 0 de 2400 | — |
| g) DES+ sin AL3 antes (no le preguntó cuáles sacar) | 0 de 2400 | — |
| g) Viaje de 3 días o más sin FN1 (salvo el caso aceptado: 3 días con ID1 en la noche del día 1) | 0 de 2400 | — |
| h) El calendario no está en orden creciente de tiempo | 0 de 2400 | — |
| h) Algún mensaje después de DES | 0 de 2400 | — |
| h) Otra pregunta entre AL1 y DES | 0 de 2400 | — |
| La compra del escenario no pasa validarCompra (mínimo 3 días, noche 19:00-22:30) | 0 de 2400 | — |
| El código tira un error (el viaje no termina) | 0 de 2400 | — |

## Hallazgos (no son invariantes pedidas, pero conviene mirarlos)

| Hallazgo | Viajes | Ejemplo más chico |
|---|---|---|
| Una noche común ("cómo fue hoy", "ya terminó el día") sale antes de las 12:00 | 0 de 2400 | — |
| FN1 ("Mañana te volvés") no sale la víspera de la vuelta | 0 de 2400 | — |
| Algo programado ya pasó cuando dice SÍ y no sale nunca (UC1, VU0; si el SÍ llega muy tarde, también ID1 y noches) | 162 de 2400 | semilla 153: 3 días (2026-10-23 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 21:30 (por defecto) · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **UC1 (2026-10-23 10:00) vence: SÍ a las 01:26** |
| AS1 (versión normal) llega el día de salida, con el SÍ (documentado en alDecirSi) | 660 de 2400 | semilla 153: 3 días (2026-10-23 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 21:30 (por defecto) · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **AS1 el 2026-10-24 01:26 Buenos Aires** |
| CA1 sin respuesta: el álbum se abre al día siguiente con AL1-P | 609 de 2400 | semilla 153: 3 días (2026-10-23 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 21:30 (por defecto) · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **CA1 sin respuesta: AL1-P al día siguiente** |
| Fotos del álbum que llegan después de cerrado (van al panel, sin contestar) | 417 de 2400 | semilla 1026: 3 días (2026-10-30 → 2026-11-01) · compra el mismo día a las 20:00 · Buenos Aires → Tokio · noche 21:30 (por defecto) · regalo · 1 propias · impreso, álbum de 20 · conducta azar, álbum tandas · cruza cambio de hora. **28 fotos** |
| Una de antes de salir mandada y sin respuesta vuelve "ya de viaje" (por diseño) | 1144 de 2400 | semilla 10: 4 días (2026-11-04 → 2026-11-07) · compra 3 días antes a las 17:04 · Madrid → Madrid · noche 21:30 · regalo · 2 propias · pdf, álbum de 40 · conducta nunca, álbum cero · cruza cambio de hora. **AS1** |
| Una reacción con pregunta adentro (AS1 con el SÍ, o COR) sale entre las 23:00 y las 8:00 | 287 de 2400 | semilla 153: 3 días (2026-10-23 → 2026-10-25) · compra el mismo día a las 22:55 · Buenos Aires → Madrid · noche 21:30 (por defecto) · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas · cruza cambio de hora. **AS1 a las 2026-10-24 01:26 Buenos Aires** |
| AL2, AL3 o DES por reloj a las 8:00 justas: no es un error (5 horas después de algo de las 3:00); lo que la franja corre sale a las 10:00 | 1 de 2400 | semilla 1747: 4 días (2026-11-01 → 2026-11-04) · compra 1 día antes a las 09:49 · CDMX → Tokio · noche 20:00 · para uno · 1 propias · impreso, álbum de 40 · conducta azar, álbum tandas · cruza cambio de hora. **AL2 2026-11-06 08:00 CDMX** |
| ID1 ocupa la noche del día 1 (12 horas o más de diferencia: las 10 de casa son la noche de allá) | 351 de 2400 | semilla 1026: 3 días (2026-10-30 → 2026-11-01) · compra el mismo día a las 20:00 · Buenos Aires → Tokio · noche 21:30 (por defecto) · regalo · 1 propias · impreso, álbum de 20 · conducta azar, álbum tandas · cruza cambio de hora. **ID1 2026-10-31 21:30 Tokio en lugar de la noche** |
| UC1 corrida 2 horas después de un SÍ tardío el día de salida | 433 de 2400 | semilla 513: 3 días (2027-01-07 → 2027-01-09) · compra el mismo día a las 09:44 · CDMX → Buenos Aires · noche 21:30 · regalo · 4 propias · impreso, álbum de 20 · conducta nunca, álbum justas. **UC1 2027-01-07 13:09 CDMX (SÍ a las 11:09)** |

## Mensajes que le llegan, por duración

Mensajes de Vitácora (todo lo que sale, acuses incluidos). "Por día": total dividido por los días de calendario entre el primer y el último mensaje; "máx. en un día": el día más cargado (fecha local de cada mensaje).

| Días | Viajes | Total (prom.) | Total (máx.) | Por día (prom.) | Máx. en un día | Preguntas por día de viaje (prom.) | Reacciones ❤️ (prom.) |
|---|---|---|---|---|---|---|---|
| 3 | 272 | 16,5 | 26 | 2,1 | 8 | 1,4 | 1,2 |
| 4 | 276 | 19,7 | 29 | 2,1 | 8 | 1,6 | 2,3 |
| 5 | 271 | 22,7 | 35 | 2,0 | 7 | 1,6 | 3,2 |
| 7 | 273 | 28,3 | 41 | 2,2 | 7 | 1,7 | 5,2 |
| 10 | 273 | 37,1 | 52 | 2,3 | 8 | 1,8 | 8,2 |
| 15 | 272 | 51,3 | 70 | 2,4 | 7 | 1,9 | 13,4 |
| 30 | 273 | 95,6 | 131 | 2,6 | 7 | 1,9 | 28,1 |
| 60 | 266 | 182,9 | 250 | 2,7 | 7 | 2,0 | 57,8 |
| otras (3-45) | 224 | 86,4 | 179 | 2,5 | 8 | 1,9 | 26,3 |

## Cuántas veces se repite cada texto en un viaje de 30 días

238 viajes de 30 días (sin contar la conducta "no contesta nunca"). Veces que sale cada ID en un mismo viaje.

| ID | Promedio por viaje | Máximo |
|---|---|---|
| ACN1 | 5,7 | 10 |
| ACN2 | 5,4 | 9 |
| ACN4 | 5,1 | 9 |
| C1 | 4,9 | 6 |
| F5 | 4,8 | 5 |
| C2 | 4,7 | 6 |
| F2 | 4,5 | 5 |
| C3 | 4,4 | 5 |
| F4 | 4,4 | 5 |
| F1 | 4,4 | 6 |
| C4 | 4,3 | 5 |
| F3 | 4,2 | 6 |
| C5 | 4,1 | 5 |
| COR | 4,0 | 37 |
| ACN3 | 3,9 | 7 |
| PAS-V2 | 3,6 | 35 |
| MD1 | 3,0 | 3 |
| MD3 | 3,0 | 3 |
| MD5 | 3,0 | 3 |
| NO1 | 3,0 | 3 |
| NO2 | 2,9 | 3 |
| NO4 | 2,8 | 3 |
| NO3 | 2,6 | 3 |
| NO9 | 2,4 | 3 |
| MD4 | 2,3 | 3 |
| NO8 | 2,3 | 3 |
| NO5 | 2,2 | 3 |
| NO7 | 2,1 | 3 |
| NO6 | 2,0 | 3 |
| PAS-V | 2,0 | 22 |
| MD9 | 2,0 | 3 |
| MD10 | 2,0 | 2 |
| MD11 | 2,0 | 2 |
| MD12 | 2,0 | 2 |
| MD6 | 2,0 | 2 |
| MD7 | 2,0 | 2 |
| MD2 | 2,0 | 2 |
| MD8 | 1,7 | 2 |
| ATR-V | 1,4 | 8 |
| PR-P | 1,3 | 5 |
| AS1 | 1,3 | 2 |
| VA1 | 1,1 | 2 |
| AS2 | 1,0 | 2 |
| IM1 | 1,0 | 2 |
| ACM1 | 1,0 | 2 |
| ACM2 | 0,8 | 2 |
| ATR1 | 0,7 | 3 |
| AL2 | 0,6 | 2 |
| ATR2 | 0,6 | 3 |
| TXT | 0,5 | 2 |
| PR-R | 0,5 | 2 |
| ATR3 | 0,4 | 3 |
| PR-R2 | 0,4 | 2 |
| PAS-A | 0,1 | 3 |

Preguntas enteras idénticas (el mismo texto, letra por letra) en un viaje de 30 días: como mucho 3 veces el mismo (promedio del peor por viaje: 3,0).

## Cuántas veces se repite cada texto en un viaje de 60 días

232 viajes de 60 días (sin contar la conducta "no contesta nunca"). Veces que sale cada ID en un mismo viaje.

| ID | Promedio por viaje | Máximo |
|---|---|---|
| ACN1 | 11,7 | 20 |
| ACN2 | 11,4 | 19 |
| C1 | 10,9 | 12 |
| ACN4 | 10,8 | 19 |
| F1 | 10,8 | 11 |
| C2 | 10,7 | 12 |
| F3 | 10,5 | 11 |
| C3 | 10,5 | 11 |
| F5 | 10,5 | 11 |
| F2 | 10,3 | 12 |
| C4 | 10,2 | 11 |
| F4 | 10,2 | 12 |
| C5 | 10,0 | 11 |
| ACN3 | 7,9 | 14 |
| COR | 7,8 | 67 |
| PAS-V2 | 7,4 | 70 |
| NO1 | 6,1 | 7 |
| NO2 | 6,1 | 7 |
| NO4 | 6,0 | 7 |
| NO3 | 6,0 | 6 |
| NO9 | 5,9 | 6 |
| NO8 | 5,8 | 6 |
| NO5 | 5,7 | 6 |
| NO7 | 5,5 | 6 |
| NO6 | 5,3 | 6 |
| MD1 | 5,0 | 5 |
| MD10 | 5,0 | 5 |
| MD3 | 5,0 | 5 |
| MD4 | 5,0 | 5 |
| MD5 | 5,0 | 5 |
| MD6 | 5,0 | 5 |
| MD7 | 5,0 | 5 |
| MD9 | 5,0 | 5 |
| MD12 | 4,6 | 5 |
| MD2 | 4,6 | 5 |
| PAS-V | 4,1 | 40 |
| MD11 | 4,0 | 4 |
| MD8 | 3,8 | 4 |
| ATR-V | 3,0 | 16 |
| ATR1 | 1,4 | 6 |
| AS1 | 1,2 | 2 |
| ATR2 | 1,2 | 5 |
| PR-P | 1,2 | 5 |
| ATR3 | 1,1 | 5 |
| IM1 | 1,1 | 2 |
| AS2 | 1,1 | 2 |
| VA1 | 1,1 | 2 |
| ACM1 | 0,9 | 2 |
| ACM2 | 0,8 | 2 |
| PR-R | 0,6 | 2 |
| AL2 | 0,6 | 2 |
| TXT | 0,6 | 2 |
| PR-R2 | 0,4 | 2 |
| PAS-A | 0,2 | 3 |

Preguntas enteras idénticas (el mismo texto, letra por letra) en un viaje de 60 días: como mucho 5 veces el mismo (promedio del peor por viaje: 5,0).

## Cuánto tarda en cerrarse el álbum

Desde AL1 hasta DES, en horas.

| Álbum | Viajes con álbum abierto | Cerrados | Promedio | Máximo | AL2 por viaje (prom.) |
|---|---|---|---|---|---|
| cero | 503 | 503 | 32,8 | 40,8 | 0,0 |
| pocas | 504 | 504 | 14,0 | 45,0 | 0,6 |
| justas | 504 | 504 | 12,2 | 45,0 | 0,4 |
| demas | 457 | 457 | 20,2 | 54,6 | 0,7 |
| tandas | 432 | 432 | 24,3 | 52,9 | 1,5 |
| todos | 2400 | 2400 | 20,6 | 54,6 | 0,6 |

0 viajes no abren el álbum. Con CA1 sin respuesta, el álbum se abre igual al día siguiente con AL1-P.
AL3 (fotos de más): 508 viajes; en 121 eligió cuáles sacar (DES sin DES+), en 387 quedaron las primeras (DES+).
