# Relevamiento 18/10: maquetas contra la web

Comparé las 55 capturas de `maquetas/capturas/` con la preview, el panel y los videos. Solo lectura. Lo que cambió a propósito (dirección «la web es un libro», D1, D4, etc.) no cuenta como faltante.

## Diseñado y no está (por importancia)
1. Entrar (`Entrar*.jpg`): diseño viejo; falta foto de Osvaldo, tinta/papel y «¿Te han regalado el libro y eres quien lo cuenta?». Chico.
2. Su voz `/voz/[token]` (`SuVoz.jpg`): diseño viejo; faltan foto a pantalla entera con «Toca y escúchale», capítulos con audio, carrusel de frases, «Compartir con la familia», cierre de venta. Medio. La página que más gente ve.
3. Rasca-rasca + cupón VITACORA10 + 4 mails (`Rasca*.jpg`): no, por D4/B12 y abogado. Grande.
4. Panel (ver abajo): «Mandárselo yo», «Cambiar la fecha de inicio», «Así le va a llegar», aviso foto chica, aviso «Guardado», tarjeta del marco con foto.
5. Casos 1 y 4 (`Casos.jpg`): «prefirió no hacerlo» con 3 salidas; «ese número no tiene WhatsApp». Medio + Joaquín.
6. Familias (`Familias.jpg`): dos hermanos al mismo libro (no); regalar desde otro país (a medias). Grande.
7. Más flujos (`MasFlujos.jpg`): enlace para que cada familiar pida su copia; «¿Ya estáis en casa?» de Viaje. Medio cada uno.
8. Narrador repasa su historia (`Narrador.jpg`). Grande, fábrica + entrevistador.
9. Landings KidsAbuelos, ViajeLuna, ViajeVolver: trabadas (K10, F4-3). Chico cada una.
10. Tarjeta de regalo Kids y Viaje. Chico.
11. 15 anuncios Meta (`Anuncios*.jpg`): no exportados y dicen «desde 49 € · te devolvemos el dinero» (choca con D1). Rehacer. Medio.
12. 7 mails del recorrido (`Emails.jpg`): de Joaquín (bot/fábrica).

## A medias
- Días sin contestar: hay aviso a los 3 días; faltan 10 días con «Mandárselo yo» y la elección de los 30 días.
- Mail de confirmación: falta nº de pedido, fecha de inicio e importes. Viaje sin mail propio.

## Panel bloque por bloque
Igual: tapa + saludo + cifras, línea de tiempo (5 pasos, sin anticipo), lo último que contó, familia, pedido (sin cifras), dirección, pausar/cerrar, dudas.
Distinto a propósito: capítulos mientras cuenta → «Lo contado» por tema (D4); 20 fotos en vez de 12.
Falta: «Cambiar la fecha de inicio» (PATCH a regalos.fecha_entrega), «Mandárselo yo», «Cambiarla» (pregunta), «Así le va a llegar», aviso foto chica, aviso «Guardado», tarjeta del marco con foto (hoy un renglón), tarjeta del PDF y seguimiento del envío en el inicio.
Detalles: en el celular las barras de la línea de tiempo casi no se distinguen; panel de Viaje en España habla de vos y la tapa de la muestra dice «EL LIBRO DE SU VIDA».

## Videos sin usar
- `web/public/video/portada-familiar-1280.mp4` y `-movil.mp4` (+ póster): el libro de Osvaldo que se abre. 5 s, sin audio.
- `web/public/video/libro-cinematico.mp4`: el mismo, 1344×768 (subido 18/10).
- `maquetas/html/assets/16cc5b84…mp4`: Viaje, libro «Lisboa · Oporto» que se abre al mapa. 7 s. No está en public.
- `maquetas/html/assets/30d8623e…mp4`: Kids, libro «Nico Rivas» con brillitos. 5 s. No está en public.

Dónde podrían ir (sin tocar el hero): /ejemplo arriba del libro para hojear; /viaje y /el-libro-del-viaje; /kids y sus landings; /regalar o junto a «Cada vida merece su propio libro». Regla MOTION 14: carga diferida, muted, playsInline, póster, pausa 3,5 s antes de repetir, sin video con «menos movimiento».
