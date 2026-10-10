export const meta = {
  name: 'escritor-v54-tres',
  description: 'Prueba v5.3 del escritor sobre una copia del libro v5.2: reescribe primera página, capítulo I y el del golpe, revisión de hechos, corrector de estilo y juicio ciego Opus contra la v5.2',
  phases: [
    { title: 'Capítulos' },
    { title: 'Hechos y arreglo' },
    { title: 'Estilo' },
    { title: 'Juicio' },
  ],
}
// Prueba corta de la v5.3 (docs/v5/escritor-v53/receta.md). Todo con Opus (Naza 02/10).
// Uso: Workflow({scriptPath, args: {dir, viejo, caps: [1, 6]}})
//   dir: copia del libro v5.2 (entradas/, salidas/ con registro, plan, capítulos, fichas e historias; sin revisión ni arreglos).
//   viejo: la carpeta del libro v5.2 (para el juicio).
// Se reescriben los capítulos de args.caps (en orden) y la primera página (al final); el resto del libro queda el de la v5.2.

const ESC = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/fabrica/scripts/escritor-v54'
const VARA = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/docs/v5/escritor/vara.md'
const DIR = args.dir
const J = `${DIR}/juicio-ciego`
const node = (s) => `node "${ESC}/${s}`
const LL = (paso) => `node "${ESC}/llamada.mjs" "${DIR}" ${paso}`

const CODIGO = { type: 'object', properties: { salidas: { type: 'array', items: { type: 'object', properties: { comando: { type: 'string' }, exit: { type: 'number' }, salida: { type: 'string' } }, required: ['comando', 'exit', 'salida'] } } }, required: ['salidas'] }
async function codigo(cmds, label, phase) {
  const r = await agent(`Corré en Bash, uno por uno y en este orden, estos comandos (las rutas tienen espacios: van entre comillas tal como están). Un exit distinto de 0 NO es un error tuyo: es el resultado; seguí con el siguiente. No arregles nada, no leas otros archivos, no opines.
${cmds.map((c, i) => `${i + 1}. ${c}`).join('\n')}
Devolvé para cada comando el comando, su código de salida y su stdout+stderr completo (si pasa de 4000 caracteres, los primeros 4000).`, { label, phase, schema: CODIGO, effort: 'low' })
  return r.salidas
}
const json = (s) => JSON.parse(s.salida.trim().split('\n').filter((l) => l.startsWith('{')).pop())

function rol(paso, archivoLlamada, archivoSalida, opts) {
  const esJSON = archivoSalida.endsWith('.json')
  const prep = opts.env ? `${opts.env} ${LL(paso)}` : LL(paso)
  return agent(`Sos un paso de un circuito que escribe una biografía.
1) Corré en Bash: ${prep}
2) Leé ENTERO, con Read, el archivo ${DIR}/llamadas/${archivoLlamada}.txt (es largo: leelo en tramos con offset/limit hasta la última línea; no te saltees nada). Ese archivo es todo tu material: documentos y, al final, las instrucciones de tu paso. No leas ningún otro archivo del disco (ni la receta, ni otras salidas, ni el código).
3) Hacé exactamente lo que piden las instrucciones del final, en el rol que te dan.
4) Guardá tu respuesta completa, tal como la devolverías y sin nada agregado (ni comentarios tuyos, ni \`\`\`), con Write en ${DIR}/${archivoSalida}.${esJSON ? ` Es JSON: verificá que parsea con  node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "${DIR}/${archivoSalida}"  y corregilo si no.` : ''}
Devolvé solo "listo" y el número de palabras del archivo que escribiste.`, { label: opts.label, phase: opts.phase })
}

// ---------- capítulos (el armador de la v5.2 no cambió: se reusa su mapa) y la primera página al final ----------
phase('Capítulos')
for (const n of args.caps) {
  const nn = String(n).padStart(2, '0')
  await rol(`capitulo ${n}`, `3b-capitulo-${nn}`, `salidas/capitulo_${nn}.md`, { label: `capítulo ${n}`, phase: 'Capítulos', env: 'PURO=1' })
  let [af] = await codigo([`${node('afuera.mjs')}" "${DIR}" ${n}`], `afuera ${n}`, 'Capítulos')
  log(af.salida.trim())
  if (af.exit === 3) {
    await rol(`capitulo ${n}`, `3b-capitulo-${nn}`, `salidas/capitulo_${nn}.md`, { label: `capítulo ${n} (de nuevo)`, phase: 'Capítulos', env: `PURO=1 ERROR="${DIR}/controles/afuera-cap_${n}.json"` })
    ;[af] = await codigo([`${node('afuera.mjs')}" "${DIR}" ${n}`], `afuera ${n} (2)`, 'Capítulos')
    log(af.salida.trim())
  }
  await rol(`resumen cap_${n}`, `3r-resumen-cap_${n}`, `salidas/resumenes/cap_${n}.md`, { label: `ficha ${n}`, phase: 'Capítulos' })
}
await rol('primera', '3a-primera', 'salidas/primera_pagina.md', { label: 'primera página', phase: 'Capítulos', env: 'PURO=1' })
{
  const [rp] = await codigo([`${node('controles.mjs')}" "${DIR}" repite primera_pagina`], 'repite primera', 'Capítulos')
  log(rp.salida.trim())
  if (rp.exit === 2) {
    await rol('primera', '3a-primera', 'salidas/primera_pagina.md', { label: 'primera página (de nuevo)', phase: 'Capítulos', env: `PURO=1 ERROR="${DIR}/controles/repite-primera_pagina.json"` })
    log((await codigo([`${node('controles.mjs')}" "${DIR}" repite primera_pagina`], 'repite primera (2)', 'Capítulos'))[0].salida.trim())
  }
}
const PRUEBA = ['primera_pagina', ...args.caps.map((n) => `cap_${n}`)]

// ---------- hechos (solo hechos) y UNA ronda de arreglo de las piezas de la prueba ----------
phase('Hechos y arreglo')
await codigo([`${node('controles.mjs')}" "${DIR}" piezas`], 'controles', 'Hechos y arreglo')
await rol('hechos', '4-hechos', 'salidas/hechos.json', { label: 'hechos', phase: 'Hechos y arreglo' })
const jn = await codigo([`SOLO_HECHOS=1 ${node('arreglos.mjs')}" "${DIR}" juntar`, `${node('estado.mjs')}" "${DIR}" arreglos`], 'juntar', 'Hechos y arreglo')
log(`juntar:\n${jn[0].salida.trim()}`)
const P = json(jn[1]).piezas.filter((p) => PRUEBA.includes(p))
await parallel(P.map((p) => () => rol(`arreglo ${p}`, `6-arreglo-${p}`, `arreglos/cambios-${p}.json`, { label: `arreglo ${p}`, phase: 'Hechos y arreglo', env: 'PURO=1' })))
if (P.length) {
  const c9 = await codigo([
    `cp "${DIR}/controles/piezas.json" "${DIR}/controles/piezas-1.json"`,
    ...P.flatMap((p) => [`${node('arreglos.mjs')}" "${DIR}" armar ${p}`, `${node('controles.mjs')}" "${DIR}" arreglo ${p}`, `${node('arreglos.mjs')}" "${DIR}" aplicar ${p}`]),
    `${node('estado.mjs')}" "${DIR}" disputas`,
  ], 'armar + C9 + aplicar', 'Hechos y arreglo')
  log(c9.filter((x) => / arreglo | armar /.test(x.comando)).map((x) => x.salida.trim()).join('\n'))
  const disp = json(c9[c9.length - 1]).disputas
  await parallel(disp.map((d) => () => agent(`Sos el verificador de hechos de una biografía. Leé ENTERO, con Read y en tramos, el archivo ${DIR}/llamadas/4-hechos.txt: usá solo sus documentos (guía, ficha, respuestas, registro); IGNORÁ el libro y las instrucciones que trae al final. No leas ningún otro archivo.
Tu única tarea:
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "${d.frase}". Respuesta ${d.id}, frase que cita: "${d.cita}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
Guardá ese JSON con Write en ${DIR}/arreglos/disputa-${d.clave}.json y devolvé lo mismo.`, { label: `disputa ${d.clave}`, phase: 'Hechos y arreglo' })))
}

// ---------- corrector de estilo (Paso 7) ----------
phase('Estilo')
await codigo([`mkdir -p "${DIR}/sin-estilo" && cp "${DIR}/salidas/"*.md "${DIR}/sin-estilo/"`], 'guardar sin estilo', 'Estilo')
await parallel(PRUEBA.map((p) => () => rol(`estilo ${p}`, `7-estilo-${p}`, `estilo/cambios-${p}.json`, { label: `estilo ${p}`, phase: 'Estilo' })))
const es = await codigo(PRUEBA.map((p) => `${node('estilo.mjs')}" "${DIR}" ${p}`), 'aplicar estilo', 'Estilo')
log(es.map((x) => x.salida.trim()).join('\n'))
// v5.3.1: segunda pasada sobre lo ya corregido
await parallel(PRUEBA.map((p) => () => rol(`estilo ${p}`, `7-estilo-${p}-2`, `estilo/cambios-${p}-2.json`, { label: `estilo ${p} (2)`, phase: 'Estilo', env: 'RONDA=2' })))
const es2 = await codigo([...PRUEBA.map((p) => `${node('estilo.mjs')}" "${DIR}" ${p} 2`), `${node('controles.mjs')}" "${DIR}" piezas`, `${node('controles.mjs')}" "${DIR}" repite primera_pagina`], 'aplicar estilo (2) + controles', 'Estilo')
log(es2.map((x) => x.salida.split('\n').slice(0, 12).join('\n')).join('\n'))

// v5.4: args.sinJuicio (la prueba en catalán no tiene contra quién compararse): termina acá, con el libro armado.
if (args.sinJuicio) { const lb = await codigo([LL('libro')], 'libro', 'Estilo'); return { libro: lb[0].salida.trim(), aviso: 'sin juicio: lo lee una persona' } }

// ---------- piezas limpias (sin marcas) de la v5.3 y de la v5.2, y juicio a ciegas con dos jueces ----------
phase('Juicio')
const archivo = (p) => (p === 'primera_pagina' ? 'primera_pagina.md' : `capitulo_${p.slice(4).padStart(2, '0')}.md`)
const limpiar = (de, a) => `sed -E 's/[[:space:]]*\\[\\[[^]]*\\]\\]//g' "${de}" > "${a}"`
await codigo([`mkdir -p "${J}"`, ...PRUEBA.flatMap((p) => [limpiar(`${DIR}/salidas/${archivo(p)}`, `${J}/v53-${p}.md`), limpiar(`${args.viejo}/salidas/${archivo(p)}`, `${J}/v52-${p}.md`)]), `wc -w "${J}/"*.md`], 'piezas limpias', 'Juicio')
const NOTAS = { type: 'object', properties: { notas: { type: 'object', properties: { A: { type: 'number' }, B: { type: 'number' } }, required: ['A', 'B'] }, se_lee_mejor: { type: 'string' }, gana: { type: 'string' }, resumen: { type: 'string' } }, required: ['notas', 'se_lee_mejor', 'gana', 'resumen'] }
const tareas = PRUEBA.flatMap((p) => [0, 1].map((k) => ({ p, k })))
const juicios = await parallel(tareas.map(({ p, k }) => async () => {
  const orden = k ? [['A', 'v5.3'], ['B', 'v5.2']] : [['A', 'v5.2'], ['B', 'v5.3']]
  const clave = Object.fromEntries(orden)
  const pre = `${p}-j${k + 1}`
  await codigo([...orden.map(([l, v]) => `cp "${J}/${v === 'v5.3' ? 'v53' : 'v52'}-${p}.md" "${J}/${pre}-${l}.md"`), `echo '${JSON.stringify(clave)}' > "${J}/clave-${pre}.json"`], `ciego ${pre}`, 'Juicio')
  const r = await agent(`Sos editor de biografías para la familia (memorias en primera persona, escritas desde una entrevista oral). Juzgás a ciegas: no sabés qué proceso escribió cada texto ni cuál es más nuevo. No leas ningún archivo fuera de los que te nombro.
1) Leé la vara: ${VARA}. Juzgás con ella, criterio por criterio, cada texto por separado; recién al final los comparás.${p === 'primera_pagina' ? ' Es la PRIMERA PÁGINA del libro (no un capítulo): además de la vara, mirá si presenta a quien narra sin adelantar historias que el libro cuenta después.' : ''}
2) Material (la verdad): ${DIR}/entradas/respuestas.xml (entera), ${DIR}/entradas/ficha.xml, ${DIR}/entradas/confirmado.xml.
3) Dos versiones del mismo tramo, de libros distintos: ${J}/${pre}-A.md y ${J}/${pre}-B.md. Ves UN tramo de cada libro: lo que falta del material puede estar en otro capítulo.
Además de la vara, mirá la REDACCIÓN de cada texto y decila en una tabla corta, con ejemplos citados: oraciones mal armadas que vienen del habla (sintaxis del audio, preposiciones, "siempre donde llego"), saltos de "yo" a "nosotros" en la misma oración, autocorrecciones del audio, sujeto borrado en escenas ("se hacía"), cierres que son una conclusión del escritor, la misma persona con dos nombres sin unir.
Escribí el juicio en castellano rioplatense con el formato de salida de la vara (tablas cortas, evidencia en frases cortas) en ${J}/juicio-${pre}.md, y devolvé las notas (A, B), cuál se lee mejor (una letra), cuál gana (una letra) y un resumen de 3 líneas.`, { label: `juicio ${pre}`, phase: 'Juicio', schema: NOTAS })
  if (!r) return null
  const d = (l) => clave[String(l).trim().charAt(0)] || l
  return { pieza: p, juez: k + 1, notas: { [clave.A]: r.notas.A, [clave.B]: r.notas.B }, se_lee_mejor: d(r.se_lee_mejor), gana: d(r.gana), resumen: r.resumen }
}))
return { juicios: juicios.filter(Boolean), aviso: 'juez y escritor son Opus: la nota filtra, decide Naza leyendo' }
