export const meta = {
  name: 'escritor-v52-tres',
  description: 'Prueba v5.2 del escritor en 3 capítulos (infancia, golpe, último): plan nuevo, armador, novelista, revisión de hechos y juicio ciego Opus contra el puro y la v5.1',
  phases: [
    { title: 'Plan' },
    { title: 'Capítulos' },
    { title: 'Hechos y arreglo' },
    { title: 'Juicio' },
  ],
}
// Prueba corta de la v5.2 (docs/v5/escritor-v52/receta.md). Todo con Opus (Naza 02/10), también el que corre comandos.
// Uso: Workflow({scriptPath: ".../workflow-tres.js", args: {dir, golpe: "R67", comparar: {infancia: {puro: "…md", "v5.1": "…md"}, golpe: {…}, ultimo: {…}}}})
// La carpeta necesita entradas/ y salidas/registro.json (se reusa el de la v5.1); el plan se rehace (borde 18, golpe).
// Ojo: solo se escriben 3 capítulos; las fichas (resumen_hasta_aca) son solo de esos, y C18 marca faltas de capítulos no escritos (no se arreglan).

const ESC = 'C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3-escritor/fabrica/scripts/escritor-v52'
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

// ---------- plan (nuevo: borde 18, el golpe junto) ----------
phase('Plan')
let okPlan = false
{
  const [ya] = await codigo([`test -f "${DIR}/salidas/plan.json" && ${node('controles.mjs')}" "${DIR}" plan`], '¿plan ya está?', 'Plan')
  if (ya.exit === 0) { okPlan = true; log('plan: ya estaba y pasa') }
  for (let i = 0; !okPlan && i <= 2; i++) {
    await rol('plan', '2-plan', 'salidas/plan.json', { label: `plan${i ? ` (reintento ${i})` : ''}`, phase: 'Plan', env: i ? `ERROR="${DIR}/controles/plan.json"` : '' })
    const [c] = await codigo([`${node('controles.mjs')}" "${DIR}" plan`], 'C plan', 'Plan')
    log(`plan: ${c.salida.split('\n').slice(0, 6).join(' | ')}`)
    okPlan = c.exit === 0
  }
}
if (!okPlan) return { error: 'el plan no pasa sus controles (C12/C13/C20/C33) después de 2 reintentos' }
const est = await codigo([`${node('estado.mjs')}" "${DIR}" capitulos`, `${node('estado.mjs')}" "${DIR}" capitulo-de ${args.golpe}`], 'capítulos', 'Plan')
const todos = json(est[0]).n
const banco = [
  { rid: 'infancia', n: todos[0] },
  { rid: 'golpe', n: json(est[1]).n },
  { rid: 'ultimo', n: todos[todos.length - 1] },
]
const ns = [...new Set(banco.map((c) => c.n))].sort((a, b) => a - b)
log(`plan: ${todos.length} capítulos; se escriben ${banco.map((c) => `${c.rid}→${c.n}`).join(', ')}`)

// ---------- los 3 capítulos, en orden: armador, novelista, afuera, ficha ----------
phase('Capítulos')
for (const n of ns) {
  const nn = String(n).padStart(2, '0')
  await rol(`armador ${n}`, `2h-armador-${nn}`, `salidas/historias/cap_${n}.md`, { label: `armador ${n}`, phase: 'Capítulos', env: 'PURO=1' })
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

// ---------- hechos (solo hechos, como el libro puro) y UNA ronda de arreglo ----------
phase('Hechos y arreglo')
await codigo([`mkdir -p "${DIR}/sin-revision" && cp "${DIR}/salidas/"capitulo_*.md "${DIR}/sin-revision/"`, `${node('controles.mjs')}" "${DIR}" piezas`], 'guardar + controles', 'Hechos y arreglo')
await rol('hechos', '4-hechos', 'salidas/hechos.json', { label: 'hechos', phase: 'Hechos y arreglo' })
const jn = await codigo([`SOLO_HECHOS=1 ${node('arreglos.mjs')}" "${DIR}" juntar`, `${node('estado.mjs')}" "${DIR}" arreglos`], 'juntar', 'Hechos y arreglo')
log(`juntar:\n${jn[0].salida.trim()}`)
const P = json(jn[1]).piezas.filter((p) => ns.map((n) => `cap_${n}`).includes(p))
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
const fin = await codigo([
  `${node('controles.mjs')}" "${DIR}" piezas`,
  `mkdir -p "${J}" && cd "${DIR}/salidas" && for n in ${ns.map((n) => String(n).padStart(2, '0')).join(' ')}; do sed -E 's/[[:space:]]*\\[\\[[^]]*\\]\\]//g' capitulo_$n.md > "${J}/v52-cap$n.md"; done && wc -w "${J}/"v52-*.md && grep -c '\\[\\[' "${J}/"v52-*.md || true`,
], 'controles + capítulos limpios', 'Hechos y arreglo')
log(`controles finales: ${fin[0].salida.split('\n').slice(0, 25).join('\n')}`)
log(fin[1].salida.trim())

// ---------- juicio a ciegas: v5.2 vs puro vs v5.1, dos jueces por capítulo con el orden rotado ----------
phase('Juicio')
const NOTAS = (letras) => ({ type: 'object', properties: {
  notas: { type: 'object', properties: Object.fromEntries(letras.map((l) => [l, { type: 'number' }])), required: letras },
  se_lee_mejor: { type: 'string' }, gana: { type: 'string' }, resumen: { type: 'string' } }, required: ['notas', 'se_lee_mejor', 'gana', 'resumen'] })
const tareas = banco.flatMap((c) => [0, 1].map((k) => ({ c, k })))
const juicios = await parallel(tareas.map(({ c, k }, i) => async () => {
  const textos = [{ quien: 'v5.2', archivo: `${J}/v52-cap${String(c.n).padStart(2, '0')}.md` }, ...Object.entries(args.comparar[c.rid]).map(([quien, archivo]) => ({ quien, archivo }))]
  const r0 = (i + 1) % textos.length
  let orden = [...textos.slice(r0), ...textos.slice(0, r0)]
  if (k) orden = orden.reverse()
  const letras = orden.map((_, j) => String.fromCharCode(65 + j))
  const clave = Object.fromEntries(orden.map((t, j) => [letras[j], t.quien]))
  const pre = `${c.rid}-j${k + 1}`
  await codigo([...orden.map((t, j) => `cp "${t.archivo}" "${J}/${pre}-${letras[j]}.md"`), `echo '${JSON.stringify(clave)}' > "${J}/clave-${pre}.json"`], `ciego ${pre}`, 'Juicio')
  const r = await agent(`Sos editor de biografías para la familia (memorias en primera persona, escritas desde una entrevista oral). Juzgás a ciegas: no sabés qué proceso escribió cada texto ni cuál es más nuevo. No leas ningún archivo fuera de los que te nombro.
1) Leé la vara: ${VARA}. Juzgás con ella, criterio por criterio, cada texto por separado; recién al final los comparás.
2) Material (la verdad): ${DIR}/entradas/respuestas.xml (entera), ${DIR}/entradas/ficha.xml, ${DIR}/entradas/confirmado.xml.
3) ${letras.length} versiones del mismo tramo de vida, de libros distintos: ${letras.map((l) => `${J}/${pre}-${l}.md`).join(', ')}. Los tramos pueden no coincidir exacto: juzgá cada uno sobre lo que abarca. Ves UN capítulo de cada libro: lo que falta del material puede estar en otro capítulo.
Además de la vara, mirá la prosa de cada texto y decilo en una tabla corta: oraciones cortadas una tras otra o que arrancan con "Y" (concierto de puntos); oraciones larguísimas o inventarios en fila que hay que releer; frases que son un "no" de la entrevista (lo que no quiso contar, lo que no tiene, lo que no hubo, "no hay mucho más que contar"); si el hecho más grave está preparado y pesa.
Escribí el juicio en castellano rioplatense con el formato de salida de la vara (tablas cortas, evidencia citada en frases cortas) en ${J}/juicio-${pre}.md, y devolvé las notas (${letras.join(', ')}), cuál se lee mejor (una letra), cuál gana (una letra) y un resumen de 3 líneas.`, { label: `juicio ${pre}`, phase: 'Juicio', schema: NOTAS(letras) })
  if (!r) return null
  const dueño = (l) => clave[String(l).trim().charAt(0)] || l
  return { capitulo: c.rid, juez: k + 1, notas: Object.fromEntries(Object.entries(r.notas).map(([l, v]) => [clave[l], v])), se_lee_mejor: dueño(r.se_lee_mejor), gana: dueño(r.gana), resumen: r.resumen }
}))
return { banco, juicios: juicios.filter(Boolean), aviso: 'juez y escritor son Opus: la nota filtra, decide Naza leyendo' }
