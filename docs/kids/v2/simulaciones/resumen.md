# Kids V2 · Simulaciones · Resumen

Generado por `fabrica/scripts/kids-v2-simular.ts`: 800 chicos inventados, semillas 1 a 800. No editar a mano.

- Terminaron: 800 de 800.
- Días de punta a punta: mediana 30, máximo 152.
- Mensajes del bot: 198808.

| Control | Qué revisa | Violaciones |
|---|---|---|
| traba | nunca se traba: si el chico sigue contestando, llega al final | 0 |
| noche | nada entre las 22 y las 9 (hora del país del número) | 0 |
| plantillas | nunca dos plantillas seguidas sin respuesta al número de las preguntas (bienvenida, PREG-NUEVA, el final por plantilla); los recordatorios y TERMINO-PADRE van aparte (decisión 12) | 0 |
| marcas | ningún texto con "{{" | 0 |
| dosPuntos | ningún dos puntos en un texto a una persona (salvo lo que escribe el padre y el link) | 0 |
| unaVez | cada principal sale una sola vez (o se re-manda con [Estamos listos] en canal B) y ninguna se saltea | 0 |
| capsula | la cápsula no recibe acuses "para el libro" (ACUSE-3, ACUSE-6) | 0 |
| escrito | si no mandó audio (escribió o mandó solo fotos), ningún acuse dice "escuché"; si mandó solo fotos, acuse de foto | 0 |
| despuesDeNo | después de [No, eso fue todo] no va ningún acuse | 0 |
| orden | después de una respuesta: otra puerta → acuse → foto → seguir; a la otra puerta contestada corta, la foto sin acuse (al final, la foto vencida va después de [Dale, otra]) | 0 |
| preocupante | después de algo preocupante, hasta la hora del día siguiente solo acuses sobrios | 0 |
| recordatorios | como mucho 2 recordatorios por silencio, y nunca al chico | 0 |
| seguirFinDeCap | no sale B-SEGUIR después de la última principal de un capítulo ni después de K47 | 0 |
| aviso | K39 siempre después de B-AVISO-SERIA | 0 |
| termino | TERMINO-PADRE una sola vez al terminar; en canal B, un día después de que llegó FINAL-CHICO (decisión 15) o, si el final sigue retenido, a los 2 días del cierre (Naza 05/10) | 0 |
| botones | como mucho 3 botones por mensaje | 0 |
| canalB | en canal B todo va al número del padre | 0 |
| fotoPegada | ninguna foto pegada desaparece: se contestó, se tocó un botón suyo, vuelve al final, o el chico cerró con [No, ya está]/[Lo dejamos acá] (o el libro cerró solo con fotos pendientes) | 0 |
| retenido | si cuenta algo (no corto) en vez de tocar el botón de la bienvenida o de un PREG-NUEVA, primero va el acuse | 0 |
| vence | lo que espera un botón no vence antes de la hora del día siguiente al que le llegó (decisión 6) | 0 |
| unaPorDia | la hora no empieza nada el día que ya le llegó una principal, ni dos veces el mismo día (decisión 10) | 0 |
| ventana | nada de texto libre a un número más de 24 h después de lo último que mandó ese número (las plantillas sí) | 0 |
| botonViejo | un botón de un mensaje que ya quedó atrás (o ya tocado) no hace nada (decisión 22) | 0 |
