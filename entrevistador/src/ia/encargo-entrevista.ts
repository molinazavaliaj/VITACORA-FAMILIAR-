import type { Perfil } from './perfil.js';
import { contarPalabras, contarPreguntas, marcasDelTratoAjeno, type TratoControlable } from './control-texto.js';

// El encargo compartido del entrevistador (biógrafo v2, 23/09 — BORRADOR de la reescritura, lo
// aprueba Naza). Todo lo que le escribe a la persona —la pregunta del día y la repregunta— parte
// de acá: quién es, cómo se le habla y lo que se respeta siempre. Antes cada prompt tenía sus
// reglas, escritas en momentos distintos: la evaluación llegó a 19 cambios, uno por error.
// Es lo mismo que `fabrica/src/libro/encargo.ts` del lado del libro.

function dato(d: { valor: string; fuente: string } | null, nombre: string): string {
  return d ? `${nombre}: ${d.valor} (${d.fuente === 'dicho' ? 'lo dijo' : d.fuente === 'ficha' ? 'lo cargó la familia' : 'deducido'})` : `${nombre}: no se sabe`;
}

/** La ficha en castellano, para los prompts: lo que no se sabe dice "no se sabe". */
export function perfilEnTexto(p: Perfil): string {
  const lineas = [
    p.persona.edad ? dato(p.persona.edad, 'Edad') : dato(p.persona.anioNacimiento, 'Año de nacimiento'),
    dato(p.persona.genero, 'Mujer u hombre'),
    dato(p.persona.comoHabla, 'Cómo prefiere que le hablen'),
    dato(p.persona.dondeViveHoy, 'Dónde vive hoy'),
    '',
    'Su vida, por etapas:',
    ...(p.etapas.length ? p.etapas.map((e) => `- ${e.edades}${e.anios ? ` (${e.anios})` : ''}: ${e.lugar}; con ${e.conQuien || 'no se sabe'}; ${e.queHacia || 'no se sabe qué hacía'}`) : ['- todavía no se sabe']),
    '',
    'Personas:',
    ...(p.personas.length ? p.personas.map((x) => `- ${x.nombre ?? '(sin nombre)'}, ${x.vinculo} — ${x.vive === 'si' ? 'vive' : x.vive === 'no' ? 'murió' : 'no se sabe si vive'}${x.nota ? ` (${x.nota})` : ''}`) : ['- todavía ninguna']),
    ...(p.bisagras.length ? ['', 'Momentos que partieron su vida:', ...p.bisagras.map((b) => `- ${b}`)] : []),
    ...(p.tono ? ['', `Cómo fue esta vida: ${p.tono}`] : []),
    ...(p.noSabemos.length ? ['', 'NO SABÉS (no lo supongas):', ...p.noSabemos.map((x) => `- ${x}`)] : []),
  ];
  return lineas.join('\n');
}

/** El trato de la ficha, si se sabe (lo que eligió la persona manda). El tú es solo para el control. */
export function tratoDelPerfil(p: Perfil): TratoControlable | null {
  const v = p.persona.comoHabla?.valor?.toLowerCase() ?? '';
  return v.includes('vos') ? 'vos' : v.includes('usted') ? 'usted' : v.includes('tú') || v.includes('tu') ? 'tu' : null;
}

function comoHablarle(p: Perfil): string {
  const v = p.persona.comoHabla?.valor?.toLowerCase() ?? '';
  const trato = v.includes('vos') ? 'Hablale de vos, que es como prefiere.'
    : v.includes('usted') ? 'Hablale de usted, que es como prefiere.'
      : v.includes('tú') || v.includes('tu') ? 'Hablale de tú, que es como prefiere.'
        : 'Todavía no sabés cómo prefiere que le hablen: usá usted, cálido y sin formalidad de oficina.';
  const g = p.persona.genero?.valor?.toLowerCase() ?? '';
  const genero = g.includes('mujer') ? 'Es una mujer: todo en femenino cuando hable de ella ("¿cómo te sentiste?" sí, "¿estabas asustado?" no).'
    : g.includes('hombre') ? 'Es un hombre: todo en masculino cuando hable de él.'
      : 'No sabés si es mujer u hombre: escribí de manera que sirva para los dos.';
  return `${trato}\n${genero}`;
}

/**
 * El encargo: quién es, cómo se le habla y lo que se respeta siempre. `evitar` son los temas que
 * la persona pidió dejar (quedan para toda la entrevista).
 */
export function encargoDelBiografo(p: Perfil, evitar: string[] = []): string {
  return `Sos el biógrafo de esta persona: le escribís por WhatsApp una pregunta por día y te contesta
con audios, para el libro de su vida.

QUIÉN ES (tu ficha; lo que dice "no se sabe" NO lo sabés):
${perfilEnTexto(p)}

CÓMO LE HABLÁS
${comoHablarle(p)}

LO QUE SE RESPETA SIEMPRE
1. No supongas nada que tu ficha no diga: ni pareja, ni hijos, ni nietos, ni que alguien vive o
   murió, ni que la infancia fue linda. Si hace falta saberlo, se pregunta, con cuidado.
2. Nunca le pidas lo que ya contó. Buscá lo que quedó abierto.
3. Si pidió dejar un tema, no se vuelve ahí nunca más, de ninguna forma.${evitar.length ? `\n   Temas que pidió dejar: ${evitar.join('; ')}.` : ''}
4. Si pidió que algo no vaya al libro, se respeta: eso no se toca.
5. Si una época fue dura, no la adornes: preguntá por lo que había, quién estaba, qué le dio
   sostén.
6. No abras con algo que nombró de pasada y duele o avergüenza (el alcohol, una pelea): si lo
   trae, se escucha; no lo convertís vos en el tema.
7. Pedí una escena, no un resumen: un día, un lugar, una persona concreta. Y en el lugar y la
   época en que pasó: si en esos años vivía en otra ciudad, es esa ciudad.
8. Una pregunta clara (dos como mucho, si van juntas), de hasta 45 palabras: la lee en el
   celular.`;
}

const MAX_PALABRAS = 50;

/** Lo que se revisa de todo lo que se le manda, antes de mandarlo. */
export function controlarTexto(texto: string, trato: TratoControlable | null): { ok: true } | { ok: false; motivo: string } {
  const t = texto.trim();
  if (contarPreguntas(t) === 0) return { ok: false, motivo: 'no tiene ninguna pregunta' };
  if (contarPalabras(t) > MAX_PALABRAS) return { ok: false, motivo: `tiene ${contarPalabras(t)} palabras (máximo ${MAX_PALABRAS})` };
  if (trato) {
    const ajenas = marcasDelTratoAjeno(t, trato);
    if (ajenas.length) return { ok: false, motivo: `le habla de otra manera que ${trato}: ${ajenas.join(', ')}` };
  }
  return { ok: true };
}
