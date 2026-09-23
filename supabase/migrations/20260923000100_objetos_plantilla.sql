-- Las ocho preguntas de objeto, en la plantilla global (3t.30).
--
-- Van en la banda 101-108, FUERA de la secuencia de días (1-26), y esto es a
-- propósito: Angel Fernández está activo en el día 13 y no tiene copia propia
-- del guion, así que lee la plantilla en vivo. Si insertáramos las preguntas
-- entre medio y corriéramos la numeración, mañana recibiría una pregunta que no
-- es la que sigue, y sus respuestas ya guardadas apuntarían a otra cosa.
--
-- El orden 101-108 no choca con nada: el reordenamiento del panel usa la banda
-- 1001+ como paso intermedio (web/src/app/api/guion/route.ts).
--
-- Están escritas en USTED, como las otras 26: `personalizarPregunta` las pasa a
-- vos cuando el narrador se trata de vos.
--
-- ⚠️ Textos nuevos de cara al narrador → los aprueba Naza antes de aplicar esto.

insert into preguntas (narrador_id, orden, texto, capitulo, tipo)
select null::uuid, v.orden, v.texto, v.capitulo, 'objeto'
from (values
  (101, 'De todo lo que tiene en su casa, ¿guardó algo de cuando era chico? Un juguete, un cuaderno de la escuela, una medalla. Si lo tiene a mano, sáquele una foto y cuénteme de dónde salió.', 'La infancia'),
  (102, '¿Quedó en su casa alguna cosa que haya sido de sus padres o de sus abuelos? Mándeme una foto y cuénteme cómo llegó a sus manos.', 'Las raíces'),
  (103, '¿Le quedó algo de aquella época? Un disco, una carta, una entrada guardada, su primer reloj. Sáquele una foto y cuénteme la historia.', 'La juventud'),
  (104, '¿Hay algo en su casa que le recuerde a esos primeros años juntos? No hace falta que sea importante, a veces es una cosa cualquiera. Mándeme una foto y cuénteme por qué ésa y no otra.', 'El amor'),
  (105, '¿Quedó alguna herramienta, algún papel, algo de su trabajo que no haya querido tirar? Mándeme una foto y cuénteme de dónde salió.', 'El oficio'),
  (106, '¿Guardó algo de cuando ellos eran chicos? Mándeme una foto y cuénteme qué le pasa cuando lo mira.', 'Los hijos'),
  (107, '¿Hubo algo que lo acompañó en esa época? Un objeto, una cábala, una foto. Si quiere, mándemela y cuénteme qué significaba para usted.', 'Las pruebas'),
  (108, '¿Hay algo en su casa que quiera que quede para los que vienen después? Mándeme una foto y cuénteme por qué eso y no otra cosa.', 'La sabiduría')
) as v(orden, texto, capitulo)
where not exists (
  select 1 from preguntas p where p.narrador_id is null and p.orden = v.orden
);
