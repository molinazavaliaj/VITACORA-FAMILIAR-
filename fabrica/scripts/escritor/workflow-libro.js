export const meta = {
  name: 'escritor-v3-libro',
  description: 'Corre un libro entero con la receta v3 del escritor (Opus, agentes en la sesión)',
  phases: [
    { title: 'Registro y plan' },
    { title: 'Escritura' },
    { title: 'Revisión' },
    { title: 'Arreglo' },
    { title: 'Repaso y cierre' },
  ],
}
// Workflow de Claude Code que corre un libro entero con la receta v3 (agentes en la sesión, USD 0 de API).
// Uso (desde un chat de Claude Code): Workflow({scriptPath: "fabrica/scripts/escritor/workflow-libro.js", args: {dir: "C:/…/<carpeta con entradas/>"}})
// El escritor y los roles heredan el modelo de la sesión (Opus); el código lo corre un agente chico; disputas con Sonnet.

const ESC = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/fabrica/scripts/escritor'
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

// ---------- 1 y 2: registro y plan, con reintentos ----------
phase('Registro y plan')
async function conReintentos(paso, llamada, archivo, control, label) {
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
const caps = json((await codigo([`${node('estado.mjs')}" "${DIR}" capitulos`], 'capítulos', 'Registro y plan'))[0])
log(`plan: ${caps.n.length} capítulos${caps.antes ? ' + Antes de cerrar' : ''}`)

// ---------- 3: escritura, en orden ----------
phase('Escritura')
await rol('primera', '3a-primera', 'salidas/primera_pagina.md', { label: 'primera página', phase: 'Escritura' })
for (const n of caps.n) {
  const nn = String(n).padStart(2, '0')
  await rol(`capitulo ${n}`, `3b-capitulo-${nn}`, `salidas/capitulo_${nn}.md`, { label: `capítulo ${n}`, phase: 'Escritura' })
}
if (caps.antes) await rol('antes', '3d-antes-de-cerrar', 'salidas/antes_de_cerrar.md', { label: 'antes de cerrar', phase: 'Escritura' })
await rol('carta', '3c-carta', 'salidas/carta.md', { label: 'carta', phase: 'Escritura' })
const pz = await codigo([LL('sus_frases'), `${node('controles.mjs')}" "${DIR}" piezas`], 'sus frases + controles', 'Escritura')
log(`controles de piezas: ${pz[1].salida.split('\n')[0]}`)

// ---------- 4, 5, 5b: revisión (tres roles ciegos, en paralelo) ----------
phase('Revisión')
await parallel([
  () => rol('hechos', '4-hechos', 'salidas/hechos.json', { label: 'hechos', phase: 'Revisión' }),
  () => rol('lectura', '5-lectura', 'salidas/lectura.json', { label: 'lectura', phase: 'Revisión' }),
  () => rol('cotejo', '5b-cotejo', 'salidas/cotejo.json', { label: 'cotejo', phase: 'Revisión' }),
])

// ---------- 6: juntar y UNA ronda de arreglos ----------
phase('Arreglo')
const jn = await codigo([`${node('arreglos.mjs')}" "${DIR}" juntar`, `${node('estado.mjs')}" "${DIR}" arreglos`], 'juntar', 'Arreglo')
log(`juntar:\n${jn[0].salida.trim()}`)
const aArreglar = json(jn[1]).piezas
await parallel(aArreglar.map((p) => () => rol(`arreglo ${p}`, `6-arreglo-${p}`, `arreglos/respuesta-${p}.txt`, { label: `arreglo ${p}`, phase: 'Arreglo' })))
// C9 contra la pieza vieja, después se aplica (en serie: el código compara con salidas/)
const c9 = await codigo([
  `cp "${DIR}/controles/piezas.json" "${DIR}/controles/piezas-1.json"`,
  ...aArreglar.flatMap((p) => [`${node('controles.mjs')}" "${DIR}" arreglo ${p}`, `${node('arreglos.mjs')}" "${DIR}" aplicar ${p}`]),
  `${node('estado.mjs')}" "${DIR}" disputas`,
], 'C9 + aplicar', 'Arreglo')
log(c9.filter((x) => x.comando.includes(' arreglo ')).map((x) => x.salida.trim()).join('\n'))

const HECHOS_DOCS = `${DIR}/llamadas/4-hechos.txt`
const disputa = (d) => agent(`Sos el verificador de hechos de una biografía. Leé ENTERO, con Read y en tramos, el archivo ${HECHOS_DOCS}: usá solo sus documentos (guía, ficha, respuestas, registro); IGNORÁ el libro y las instrucciones que trae al final. No leas ningún otro archivo.
Tu única tarea:
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "${d.frase}". Respuesta ${d.id}, frase que cita: "${d.cita}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
Guardá ese JSON con Write en ${DIR}/arreglos/disputa-${d.clave}.json y devolvé lo mismo.`, { label: `disputa ${d.clave}`, phase: 'Arreglo', model: 'sonnet' })
const disp1 = json(c9[c9.length - 1]).disputas
await parallel(disp1.map((d) => () => disputa(d)))

// ---------- repaso de hechos (C26), controles otra vez (C24), libro e informe ----------
phase('Repaso y cierre')
if (aArreglar.length) {
  await rol('hechos repaso', '4-hechos-repaso', 'salidas/hechos-repaso.json', { label: 'hechos repaso', phase: 'Repaso y cierre' })
  const rp = await codigo([`${node('controles.mjs')}" "${DIR}" repaso`, `${node('estado.mjs')}" "${DIR}" repaso`], 'C26', 'Repaso y cierre')
  log(rp[0].salida.trim())
  await parallel(json(rp[1]).disputas.map((d) => () => disputa(d)))
}
const fin = await codigo([
  `${node('controles.mjs')}" "${DIR}" piezas`,
  LL('libro'),
  `${node('informe.mjs')}" "${DIR}"`,
], 'controles + libro + informe', 'Repaso y cierre')
return { capitulos: caps.n.length, arreglados: aArreglar, disputas: disp1.length, controles_final: fin[0].salida.split('\n')[0], libro: fin[1].salida.trim() }
