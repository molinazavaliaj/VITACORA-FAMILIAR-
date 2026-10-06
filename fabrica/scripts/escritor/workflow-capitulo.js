export const meta = {
  name: 'escritor-prueba-capitulo',
  description: 'Prueba corta: registro, plan y UN capítulo con la receta del escritor, revisión, una ronda de arreglo y juicio a ciegas de Fable con la vara fija',
  phases: [
    { title: 'Registro y plan' },
    { title: 'Capítulo' },
    { title: 'Revisión y arreglo' },
    { title: 'Juicio' },
  ],
}
// Prueba corta de la receta (Naza, 02/10): para iterar no hace falta el libro entero. Se escribe solo el capítulo que
// cuenta la respuesta args.rid (el del hecho fuerte) y Fable lo juzga a ciegas contra el mismo capítulo de otro libro
// (args.anterior), con docs/v3/escritor/vara-del-10.md. El libro entero se corre (workflow-libro.js) cuando el capítulo gana.
// Uso: Workflow({scriptPath, args: {dir: "C:/…/<carpeta con entradas/>", rid: "R67", anterior: "C:/…/capitulo-viejo.md"}})
// Ojo: el capítulo se escribe sin los anteriores (libro_hasta_aca vacío); C18/C17 marcan cosas de otras piezas que acá no se arreglan.

const ESC = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/fabrica/scripts/escritor'
const VARA = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/docs/v3/escritor/vara-del-10.md'
const DIR = args.dir
const node = (s) => `node "${ESC}/${s}`
const LL = (paso) => `node "${ESC}/llamada.mjs" "${DIR}" ${paso}`

const CODIGO = { type: 'object', properties: { salidas: { type: 'array', items: { type: 'object', properties: { comando: { type: 'string' }, exit: { type: 'number' }, salida: { type: 'string' } }, required: ['comando', 'exit', 'salida'] } } }, required: ['salidas'] }

// Corre comandos de código y devuelve lo que imprimen. No interpreta nada.
async function codigo(cmds, label, phase) {
  const r = await agent(`Corré en Bash, uno por uno y en este orden, estos comandos (las rutas tienen espacios: van entre comillas tal como están). Un exit distinto de 0 NO es un error tuyo: es el resultado; seguí con el siguiente. No arregles nada, no leas otros archivos, no opines.
${cmds.map((c, i) => `${i + 1}. ${c}`).join('\n')}
Devolvé para cada comando el comando, su código de salida y su stdout+stderr completo (si pasa de 4000 caracteres, los primeros 4000).`, { label, phase, schema: CODIGO, model: 'sonnet', effort: 'low' })
  return r.salidas
}
const json = (s) => JSON.parse(s.salida.trim().split('\n').filter((l) => l.startsWith('{')).pop())

// Un rol de la receta: arma su llamada, la lee entera y deja la respuesta en un archivo.
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

// ---------- registro y plan, con reintentos ----------
phase('Registro y plan')
async function conReintentos(paso, llamada, archivo, control, label) {
  const [ya] = await codigo([`test -f "${DIR}/${archivo}" && ${node('controles.mjs')}" "${DIR}" ${control}`], `¿${control} ya está?`, 'Registro y plan')
  if (ya.exit === 0) { log(`${control}: ya estaba y pasa`); return true }
  for (let i = 0; i <= 2; i++) {
    const env = i ? `ERROR="${DIR}/controles/${control}.json"` : ''
    await rol(paso, llamada, archivo, { label: `${label}${i ? ` (reintento ${i})` : ''}`, phase: 'Registro y plan', env })
    const [c] = await codigo([`${node('controles.mjs')}" "${DIR}" ${control}`], `C ${control}`, 'Registro y plan')
    log(`${control}: ${c.salida.split('\n')[0]}`)
    if (c.exit === 0) return true
  }
  return false
}
if (!(await conReintentos('registro', '1-registro', 'salidas/registro.json', 'registro', 'registro'))) return { error: 'el registro no pasa C14 después de 2 reintentos' }
if (!(await conReintentos('plan', '2-plan', 'salidas/plan.json', 'plan', 'plan'))) return { error: 'el plan no pasa C12/C13/C19/C20 después de 2 reintentos' }
const cap = json((await codigo([`${node('estado.mjs')}" "${DIR}" capitulo-de ${args.rid}`], 'capítulo a probar', 'Registro y plan'))[0])
if (!cap.n) return { error: `el plan no tiene ningún capítulo con ${args.rid}` }
const nn = String(cap.n).padStart(2, '0'), P = `cap_${cap.n}`
log(`se prueba el capítulo ${cap.n}: «${cap.titulo}»`)

// ---------- el capítulo ----------
phase('Capítulo')
await rol(`capitulo ${cap.n}`, `3b-capitulo-${nn}`, `salidas/capitulo_${nn}.md`, { label: `capítulo ${cap.n}`, phase: 'Capítulo' })
const pz = await codigo([`${node('controles.mjs')}" "${DIR}" piezas`], 'controles', 'Capítulo')
log(`controles: ${pz[0].salida.split('\n')[0]} (incluye faltas de otras piezas, que acá no se escriben)`)

// ---------- revisión (tres roles ciegos) y UNA ronda de arreglo, solo de este capítulo ----------
phase('Revisión y arreglo')
await parallel([
  () => rol('hechos', '4-hechos', 'salidas/hechos.json', { label: 'hechos', phase: 'Revisión y arreglo' }),
  () => rol('lectura', '5-lectura', 'salidas/lectura.json', { label: 'lectura', phase: 'Revisión y arreglo' }),
  () => rol('cotejo', '5b-cotejo', 'salidas/cotejo.json', { label: 'cotejo', phase: 'Revisión y arreglo' }),
])
const jn = await codigo([`${node('arreglos.mjs')}" "${DIR}" juntar`, `${node('estado.mjs')}" "${DIR}" arreglos`], 'juntar', 'Revisión y arreglo')
log(`juntar:\n${jn[0].salida.trim()}`)
let disp1 = []
if (json(jn[1]).piezas.includes(P)) {
  await rol(`arreglo ${P}`, `6-arreglo-${P}`, `arreglos/cambios-${P}.json`, { label: `arreglo ${P}`, phase: 'Revisión y arreglo' })
  const c9 = await codigo([
    `cp "${DIR}/controles/piezas.json" "${DIR}/controles/piezas-1.json"`,
    `${node('arreglos.mjs')}" "${DIR}" armar ${P}`, `${node('controles.mjs')}" "${DIR}" arreglo ${P}`, `${node('arreglos.mjs')}" "${DIR}" aplicar ${P}`,
    `${node('estado.mjs')}" "${DIR}" disputas`,
  ], 'armar + C9 + aplicar', 'Revisión y arreglo')
  log(c9.slice(1, 4).map((x) => x.salida.trim()).join('\n'))
  disp1 = json(c9[c9.length - 1]).disputas
  const disputa = (d) => agent(`Sos el verificador de hechos de una biografía. Leé ENTERO, con Read y en tramos, el archivo ${DIR}/llamadas/4-hechos.txt: usá solo sus documentos (guía, ficha, respuestas, registro); IGNORÁ el libro y las instrucciones que trae al final. No leas ningún otro archivo.
Tu única tarea:
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "${d.frase}". Respuesta ${d.id}, frase que cita: "${d.cita}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
Guardá ese JSON con Write en ${DIR}/arreglos/disputa-${d.clave}.json y devolvé lo mismo.`, { label: `disputa ${d.clave}`, phase: 'Revisión y arreglo', model: 'sonnet' })
  await parallel(disp1.map((d) => () => disputa(d)))
  await rol('hechos repaso', '4-hechos-repaso', 'salidas/hechos-repaso.json', { label: 'hechos repaso', phase: 'Revisión y arreglo' })
  const rp = await codigo([`${node('controles.mjs')}" "${DIR}" repaso`, `${node('estado.mjs')}" "${DIR}" repaso`], 'C26', 'Revisión y arreglo')
  log(rp[0].salida.trim())
  await parallel(json(rp[1]).disputas.map((d) => () => disputa(d)))
}
const fin = await codigo([
  `${node('controles.mjs')}" "${DIR}" piezas`,
  LL('libro'),
  `${node('informe.mjs')}" "${DIR}"`,
  `mkdir -p "${DIR}/juicio-ciego" && awk '/^# /{c++} c>=2' "${DIR}/libro.md" > "${DIR}/juicio-ciego/capitulo-X.md" && cp "${args.anterior}" "${DIR}/juicio-ciego/capitulo-Y.md" && echo "X=nuevo Y=anterior" > "${DIR}/clave-juicio.txt" && wc -w "${DIR}/juicio-ciego/"*.md`,
], 'libro + informe + juicio a ciegas', 'Revisión y arreglo')
log(fin[3].salida.trim())

// ---------- juicio a ciegas con la vara fija ----------
phase('Juicio')
const NOTA = { type: 'object', properties: { nota_X: { type: 'number' }, nota_Y: { type: 'number' }, techo_entrevista: { type: 'string' }, gana: { type: 'string' }, resumen: { type: 'string' } }, required: ['nota_X', 'nota_Y', 'gana', 'resumen'] }
const juicio = await agent(`Sos editor de biografías para la familia (memorias en primera persona, escritas desde una entrevista oral). Juzgás a ciegas: no sabés qué proceso escribió cada texto ni cuál es más nuevo. No leas ningún archivo fuera de los que te nombro.
1) Leé la vara fija: ${VARA}. Juzgás con ella, criterio por criterio, cada capítulo por separado (no contra el otro); recién al final los comparás.
2) Material (la verdad): ${DIR}/entradas/respuestas.xml (entera), ${DIR}/entradas/ficha.xml, ${DIR}/entradas/confirmado.xml.
3) El mismo tramo de vida contado por dos libros distintos: ${DIR}/juicio-ciego/capitulo-X.md y ${DIR}/juicio-ciego/capitulo-Y.md. Ves UN capítulo de cada libro: lo que falta del material puede estar en otro capítulo; no lo cuentes como perdido salvo que sea de este tramo y el capítulo quede cojo sin eso.
Escribí el juicio en castellano rioplatense con el formato de salida de la vara (tablas cortas, evidencia citada en frases cortas) en ${DIR}/juicio-ciego/juicio-fable.md, y devolvé las dos notas, el techo de la entrevista, cuál gana y un resumen de 3 líneas.`, { label: 'juicio Fable', phase: 'Juicio', model: 'fable', schema: NOTA })
return { capitulo: cap.n, titulo: cap.titulo, disputas: disp1.length, controles_final: fin[0].salida.split('\n')[0], juicio }
