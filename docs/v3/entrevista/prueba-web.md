# Prueba web: hacer la entrevista V3 como narrador

Una página en tu PC que hace de WhatsApp: el biógrafo te manda los mensajes, contestás con **audio grabado en la página** (o escribiendo) y tocás los botones. Por dentro corre el mismo código de la entrevista que las simulaciones (`fabrica/src/v3/entrevista/` a través de `fabrica/scripts/v3-entrevista-turno.ts`).

## Cómo arrancarla

En PowerShell, una línea:

```powershell
cd "C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3\fabrica"; npx tsx scripts/v3-entrevista-web.ts --nombre Naza --genero varon
```

Después abrí **http://localhost:5178** en Chrome o Edge. La primera vez que toques "Grabar", el navegador pide permiso para el micrófono: dale que sí. Para apagarla, `Ctrl+C` en la terminal.

- Sin `--nombre`, la página te pide nombre y género.
- Si cerrás y volvés a arrancar, sigue donde quedó.
- "Empezar de cero" arranca otra entrevista; la anterior no se borra, queda en una carpeta con la fecha.
- Otras opciones: `--puerto 5178`, `--env <ruta del .env>` (por defecto el de `VITACORA FAMILIAR\fabrica\.env`), `--datos <carpeta>`.

## Dónde queda todo

En `audios-crudos\v3-web\<nombre>\`, en la raíz del worktree (esa carpeta **no va a git**: son voces reales):

- `audios\NN-<pregunta>.webm`: cada audio, tal cual lo grabaste. Nunca se pisan.
- `transcripciones.jsonl`: una línea por audio (archivo, pregunta, lo que se entendió, segundos, fecha).
- `charla.md`: la charla entera con los IDs de cada mensaje, para el equipo. Se rehace en cada turno.
- `estado.json`: por dónde va la entrevista.

## Qué hay que saber

- **Es local**: solo se abre en esta PC (no se puede entrar desde el celular ni desde otra máquina).
- **La transcripción cuesta**: cada audio va a OpenAI (`gpt-transcribe`, unos USD 0,005 por minuto). El pie de la página muestra los minutos transcriptos. Escribir o tocar botones no cuesta nada.
- Si la transcripción falla (sin internet, error de OpenAI), el audio queda guardado y aparece "Reintentar".
- En la pregunta de la foto (FO1) no se pueden mandar fotos: contala con audio o por escrito.
