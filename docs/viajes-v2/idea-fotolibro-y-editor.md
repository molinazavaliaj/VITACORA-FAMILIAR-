# El libro de viaje: fotolibro y editor (idea, Naza 25/10)

Anotado para más adelante. Todavía no se hace.

## Cómo lo imaginamos

- El libro de viaje es un **fotolibro**: muchas fotos y poco texto. No es un
  libro de capítulos como el de Familiar.
- Vale para las dos cosas: el libro de muestra de la web y el libro que se
  imprime de verdad.
- Con los primeros viajeros vamos a estar nosotros en el medio (human in the
  loop) para armarlo bien a mano.

## La idea del editor

Una página donde cada persona pueda **editar su propio libro de viaje**, como
hacen las páginas que venden fotolibros: elegir y mover fotos, cambiar el
orden de las páginas, sacar o acortar textos, y ver cómo queda antes de
mandarlo a imprimir.

## Lo que ya se hizo (25/10)

- En /viaje, el libro 3D del inicio, al abrirse, es un álbum: páginas blancas
  con seis fotos en grilla y sin texto, como los fotolibros (antes era una página llena de texto
  y una foto). Las fotos están en `web/src/app/_viaje/viaje.tsx` (ALBUM): la del hotel y
  cinco hechas con Higgsfield a partir de las de Sara y Dani (25/10). Se cambian ahí,
  y van en `web/public/rediseno/viaje-*.jpg`.
