-- Las 25 preguntas fijas de Vitácora Familiar — el guion de la vida.
-- Firmadas por los dos socios en la sesión de brainstorming del 2026-09-01.
-- Los días 26-30 son adaptativos: los genera el cerebro por narrador (tipo 'adaptativa').

insert into preguntas (narrador_id, orden, texto, capitulo, tipo) values
  -- LA INFANCIA
  (null, 1,  'Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?', 'La infancia', 'fija'),
  (null, 2,  '¿Cómo eran su mamá y su papá? ¿Qué hacían, cómo era vivir con ellos? Cuénteme cómo los recuerda a cada uno.', 'La infancia', 'fija'),
  (null, 3,  '¿A qué jugaba de chico, y con quién? ¿Hermanos, amigos del barrio? Cuénteme alguna travesura que todavía lo haga reír.', 'La infancia', 'fija'),
  (null, 4,  '¿Cómo era su escuela? ¿Tuvo algún maestro o compañero que nunca se olvidó?', 'La infancia', 'fija'),

  -- LAS RAÍCES
  (null, 5,  'Hábleme de sus abuelos y de dónde viene su familia. ¿Qué historias le contaban de antes de que usted naciera?', 'Las raíces', 'fija'),
  (null, 6,  'Hábleme de sus hermanos. ¿Cómo era cada uno, con quién se llevaba mejor? ¿O fue hijo único — cómo era eso?', 'Las raíces', 'fija'),
  (null, 7,  '¿Qué tradiciones había en su casa? Las comidas, las fiestas, los domingos... ¿qué olores y sabores lo devuelven a esa mesa?', 'Las raíces', 'fija'),

  -- LA JUVENTUD
  (null, 8,  'Vamos a sus quince, dieciséis años. ¿Cómo era un sábado a la noche? ¿Qué música sonaba, qué se bailaba, cómo se vestían para salir, a dónde iban?', 'La juventud', 'fija'),
  (null, 9,  'Hábleme de la banda de amigos de esa época. ¿Quiénes eran, cómo se conocieron? ¿Qué hacían juntos — la pelota, el club, el café? ¿Queda alguno con quien todavía se hable?', 'La juventud', 'fija'),
  (null, 10, 'En su época no todos podían seguir estudiando. ¿Hasta dónde llegó usted con los estudios, y cómo fue esa decisión? ¿La eligió, o la vida la eligió por usted?', 'La juventud', 'fija'),
  (null, 11, 'Cuénteme de su primer trabajo y su primer sueldo. ¿Cómo lo consiguió, qué hizo con esa primera plata?', 'La juventud', 'fija'),
  (null, 12, 'Ahora cuénteme ESA historia: la que se cuenta en las sobremesas cuando todos ya se rieron dos veces. El lío del que se salvó raspando, la locura que hizo por una apuesta o por amor. Todos tenemos una. ¿Cuál es la suya?', 'La juventud', 'fija'),

  -- EL AMOR
  (null, 13, '¿Cómo conoció al amor de su vida? Lléveme a ese día: dónde fue, qué pensó cuando la vio, quién dio el primer paso.', 'El amor', 'fija'),
  (null, 14, '¿Cómo era el noviazgo en esa época? Cuénteme el día que la presentó en su casa — ¿qué dijeron sus padres, cómo lo recibieron sus suegros? ¿Y cómo fue la propuesta de casamiento y el día de la boda?', 'El amor', 'fija'),
  (null, 15, 'Un amor de tantos años no es todo color de rosa. ¿Qué tormentas pasaron juntos, y cómo hicieron para superarlas? Después de todo eso... ¿qué le diría a un nieto que le pregunta cómo se hace para querer a alguien toda la vida?', 'El amor', 'fija'),

  -- EL OFICIO
  (null, 16, '¿A qué le dedicó su vida? Cuénteme cómo llegó a ese camino: ¿lo eligió, lo heredó, se dio solo?', 'El oficio', 'fija'),
  (null, 17, 'Cuénteme la mejor anécdota de sus años de trabajo. Esa que contaba al llegar a casa, o la que nunca contó.', 'El oficio', 'fija'),
  (null, 18, 'Hablemos de la plata, con confianza. ¿Le costó ganarla? ¿Qué riesgos tomó en la vida — un negocio, una casa, una apuesta grande? ¿Hubo épocas flacas? Y después de todo... ¿qué relación ve usted entre el dinero y la felicidad?', 'El oficio', 'fija'),

  -- LOS HIJOS (Y LOS NIETOS)
  (null, 19, 'Cuénteme el día que nació su primer hijo. ¿Dónde estaba usted, qué sintió cuando lo tuvo en brazos, cómo eligieron el nombre? ¿Y cómo fueron llegando los demás?', 'Los hijos', 'fija'),
  (null, 20, 'Ahora hábleme de cada uno de sus hijos. ¿Cómo es cada uno, a quién salió, qué admira de cada uno? Tómese su tiempo — quiero conocerlos a todos.', 'Los hijos', 'fija'),
  (null, 21, '¿Cómo fue usted como padre? ¿Qué quiso darles a sus hijos que usted no tuvo, y qué le costó más? ¿Y qué se siente ser abuelo?', 'Los hijos', 'fija'),

  -- LAS PRUEBAS
  (null, 22, 'La vida siempre pone pruebas: una pérdida, un fracaso, un despido, una enfermedad, una época que dolió. ¿Cuáles fueron las suyas? Cuente lo que quiera contar, como quiera contarlo.', 'Las pruebas', 'fija'),
  (null, 23, '¿Y de dónde sacó la fuerza? ¿Qué lo ayudó a levantarse — la familia, la fe, el trabajo, el carácter? ¿Qué aprendió de esas épocas que hoy se lo pueda dejar dicho a los suyos?', 'Las pruebas', 'fija'),

  -- LA SABIDURÍA
  (null, 24, 'Mirando toda su vida: ¿cuáles fueron sus alegrías más grandes, y de qué está más orgulloso? Y regálenos también esas frases o refranes que usted repite desde siempre — esos que en su familia ya son suyos.', 'La sabiduría', 'fija'),
  (null, 25, 'Si sus nietos, y los hijos de sus nietos, escucharan esto dentro de cincuenta años... ¿qué quiere decirles? Este es su mensaje para ellos. Tómese todo el tiempo del mundo.', 'La sabiduría', 'fija');
