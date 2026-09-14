# audios-crudos — la caja donde caen las voces de los narradores

Mientras Meta no habilite la API de WhatsApp, las preguntas salen a mano y los
audios vuelven a mano. Esta carpeta es el paso intermedio: acá se guardan los
audios con el nombre que el resto del sistema ya espera, y de acá los levanta la
puerta manual.

## El nombre no es decorativo

```
audios-crudos/<narrador>/dia_07.ogg      ← la respuesta a la pregunta 7
audios-crudos/<narrador>/dia_07_2.ogg    ← la repregunta de ese mismo día
```

- `NN` con **dos dígitos**, y se numera por **orden de pregunta, no por fecha**:
  el audiolibro arma cada capítulo con las órdenes que le tocan
  (`fabrica/src/audio/audiolibro.ts`), así que el nombre decide en qué parte del
  libro suena esa voz.
- `<narrador>` es el slug del nombre: `Pequeña Imma` → `imma`, `Don Osvaldo` →
  `don-osvaldo`. El mismo slug que imprime `npm run manual -- estado`.
- `.ogg` es el formato natural de las notas de voz de WhatsApp. También acepta
  `.opus`, `.mp3`, `.m4a` y `.wav` para una carga puntual.

## El ciclo, en tres comandos

```bash
# 1. ¿A quién le toca qué?
npm run manual -- estado

# 2. El mensaje exacto para pegarle al narrador (se anota en `envios`)
npm run manual -- siguiente imma

# 3. Cuando contesta: se sube a Storage, se transcribe, se evalúa y avanza
npm run manual -- cargar imma audios-crudos/imma/dia_01.ogg
```

Si el audio todavía no tiene nombre propio (una nota recién bajada,
`PTT-20260914-WA0007.ogg`), va directo:

```bash
npm run manual -- cargar imma "C:/Users/Naza/Downloads/PTT-20260914-WA0007.ogg"
```

El orden lo deduce solo (la pregunta vigente sin responder) y guarda una copia
acá con el nombre canónico. Un lote entero de una vez:

```bash
npm run manual -- cargar-carpeta imma audios-crudos/imma        # muestra el plan
npm run manual -- cargar-carpeta imma audios-crudos/imma --si   # lo carga
```

## Dos cosas que conviene no olvidar

- **Estos audios son de personas reales**: no van a git (la carpeta está en
  `.gitignore`) ni a ninguna carpeta compartida.
- **Storage manda**: la copia de acá es respaldo y convención de nombres. Lo que
  la fábrica lee es el bucket `audios` de Supabase, que lo escribe `cargar`.
