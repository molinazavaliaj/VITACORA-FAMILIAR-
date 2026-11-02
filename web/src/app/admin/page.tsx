import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { contarPorGravedad, frenosDe, horasEntre, UMBRALES, type Freno } from "@/lib/admin/frenos";
import { contarSinVer } from "@/lib/admin/notificaciones";
import { avanceDe, avanceEnPalabras } from "@/lib/admin/avance";
import { Cifra, Grupo, Item, Leyenda, Proporcion, SinDatos, Titulo, cuando, horasEnPalabras, type Color } from "./ui";
import { Icono, SECCIONES } from "./secciones";

// 01 · Estado — «qué se frenó y qué hay que hacer hoy». Es la pantalla de entrada, y se
// lee de arriba abajo en tres pasos: el veredicto del día en una frase, los cuatro números
// que lo sostienen (cada uno lleva a su lista), y las listas. Abajo de todo, el recorrido
// del panel: qué contesta cada pantalla, para el que entra por primera vez.

const FECHA = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
const HORA = new Intl.DateTimeFormat("es-ES", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Madrid" });

/** El saludo según la hora de Madrid, que es la de la casa. */
function saludo(ahora: Date): string {
  const h = Number(HORA.format(ahora));
  return h < 13 ? "Buen día" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

const primeraMayuscula = (t: string) => t.charAt(0).toLocaleUpperCase("es") + t.slice(1);

/** El día en una frase: qué hacer primero. */
function veredicto(rojo: number, ambar: number): { color: Color; frase: string; bajada: string } {
  if (rojo > 0) {
    return {
      color: "rojo",
      frase: rojo === 1 ? "Hay una cosa frenada." : `Hay ${rojo} cosas frenadas.`,
      bajada: "Empiecen por ahí: es lo que se pasó del tiempo y no se destraba solo.",
    };
  }
  if (ambar > 0) {
    return {
      color: "ambar",
      frase: "Nada frenado.",
      bajada: ambar === 1 ? "Hay una sola cosa para tener a la vista, sin apuro." : `Hay ${ambar} cosas para tener a la vista, sin apuro.`,
    };
  }
  return { color: "verde", frase: "Todo va solo.", bajada: "Hoy no hay nada que hacer: el carril está limpio." };
}

export default async function PantallaEstado() {
  const ahora = new Date();
  const db = crearClienteServidor();
  const datos = await datosDelPanel(db, ahora);
  const frenos = frenosDe(datos, ahora);
  const cuenta = contarPorGravedad(frenos);

  // Los avisos sin ver: si la tabla no está (o no se puede leer), la cifra no sale.
  let sinVer: number | null = null;
  try {
    sinVer = await contarSinVer(db);
  } catch {
    // sin la cifra: el resto de la pantalla se ve igual
  }

  const deGravedad = (g: Freno["gravedad"]) => frenos.filter((f) => f.gravedad === g);

  // «Va solo» no sale de los frenos (que sólo tienen lo que anda mal): sale de mirar los
  // narradores al día y los libros entregados.
  const alDia = datos.narradores.filter((n) => {
    if (n.estado !== "activo") return false;
    const horas = horasEntre(n.ultima_respuesta_at, ahora);
    return horas !== null && horas <= UMBRALES.silencioDias * 24;
  });
  const terminados = datos.narradores.filter((n) => n.estado === "completado" || n.estado === "cerrado_anticipado");
  const vaSolo = alDia.length + terminados.length;
  const v3De = new Map(datos.entrevistasV3.map((e) => [e.narrador_id, e]));
  const dia = veredicto(cuenta.rojo, cuenta.ambar);

  const linea = (f: Freno, i: number) => (
    <Item
      key={`${f.que}-${i}`}
      color={f.gravedad === "rojo" ? "rojo" : "ambar"}
      titulo={f.detalle}
      detalle={f.quien ? `Es de ${f.quien}.` : undefined}
      hace={f.horas === null ? undefined : horasEnPalabras(f.horas)}
    />
  );

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin" />

      {/* El veredicto: la hoja de tinta, lo primero que se lee. */}
      <section className="adm-hoja adm-hoja--tinta relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
        <p className="adm-micro first-letter:uppercase">
          {saludo(ahora)} · {FECHA.format(ahora)}
        </p>
        <p className="adm-h1 mt-4 flex items-center gap-4" style={{ fontSize: "clamp(1.9rem, 1.4rem + 2vw, 3rem)" }}>
          <span className={`adm-punto adm-tono-${dia.color}`} style={{ width: 12, height: 12 }} />
          {dia.frase}
        </p>
        <p className="adm-pregunta mt-3 max-w-[52ch]">{dia.bajada}</p>
        <div className="mt-7 max-w-[560px]">
          <Proporcion
            etiqueta={`${cuenta.rojo} frenadas, ${cuenta.ambar} para estar atento, ${vaSolo} que van solas`}
            partes={[
              { valor: cuenta.rojo, color: "rojo" },
              { valor: cuenta.ambar, color: "ambar" },
              { valor: vaSolo, color: "verde" },
            ]}
          />
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra
          href="#se-freno"
          color="rojo"
          etiqueta="Se frenó"
          valor={cuenta.rojo}
          detalle={cuenta.rojo === 0 ? "nada pasado de tiempo" : "se pasó del tiempo: hay que destrabar"}
        />
        <Cifra
          href="#atento"
          color="ambar"
          etiqueta="Para estar atento"
          valor={cuenta.ambar}
          detalle={cuenta.ambar === 0 ? "nadie atrasado" : "quieto, y por ahora es normal"}
        />
        <Cifra
          href="#va-solo"
          color="verde"
          etiqueta="Va solo"
          valor={vaSolo}
          detalle={`${alDia.length} al día · ${terminados.length} terminadas`}
        />
        <Cifra
          href="/admin/notificaciones?ver=sin-ver"
          etiqueta="Avisos sin ver"
          valor={sinVer ?? "—"}
          detalle={sinVer === null ? "no se pudieron contar" : sinVer === 0 ? "están todos vistos" : "los mails de los robots, en Notificaciones"}
        />
      </div>

      {datos.narradores.length === 0 && datos.pedidos.length === 0 ? (
        <div className="mt-8">
          <SinDatos que="Todavía no hay ninguna historia en curso: cuando entre el primer libro, acá aparece qué se frenó." />
        </div>
      ) : null}

      <div className="mt-10">
        <Grupo id="se-freno" color="rojo" titulo="Se frenó" cuenta={cuenta.rojo}>
          {deGravedad("rojo").length === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nada frenado. El carril está limpio.</p>
          ) : (
            deGravedad("rojo").map(linea)
          )}
        </Grupo>

        <Grupo id="atento" color="ambar" titulo="Hay que estar atento" cuenta={cuenta.ambar}>
          {deGravedad("ambar").length === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nadie atrasado con lo suyo.</p>
          ) : (
            deGravedad("ambar").map(linea)
          )}
        </Grupo>

        <Grupo id="va-solo" color="verde" titulo="Va solo" cuenta={vaSolo}>
          {vaSolo === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nadie respondió todavía en los últimos días.</p>
          ) : (
            <>
              {alDia.map((n) => (
                <Item
                  key={n.id}
                  color="verde"
                  titulo={`${n.nombre ?? "Sin nombre"}, al día.`}
                  detalle={`${primeraMayuscula(avanceEnPalabras(avanceDe(n, v3De.get(n.id), datos.conteo)))} · contestó ${cuando(n.ultima_respuesta_at, ahora)}.`}
                  hace={cuando(n.ultima_respuesta_at, ahora)}
                />
              ))}
              {terminados.map((n) => (
                <Item
                  key={n.id}
                  color="verde"
                  titulo={`${n.nombre ?? "Sin nombre"}, terminado.`}
                  detalle={
                    n.libro_aprobado_at
                      ? `El libro se aprobó ${cuando(n.libro_aprobado_at, ahora)}.`
                      : "La entrevista cerró y el libro está en camino."
                  }
                  hace={cuando(n.libro_aprobado_at, ahora)}
                />
              ))}
            </>
          )}
        </Grupo>
      </div>

      <Leyenda
        items={[
          { color: "rojo", texto: "rojo: se pasó del tiempo, hay algo frenado" },
          { color: "ambar", texto: "ámbar: quieto, y es normal" },
          { color: "verde", texto: "verde: trabajó dentro del tiempo esperado" },
        ]}
      />

      {/* El recorrido: las otras pantallas y la pregunta que contesta cada una. */}
      <section className="mt-14">
        <h2 className="adm-micro mb-4">El panel, pantalla por pantalla</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SECCIONES.filter((s) => s.href !== "/admin").map((s) => (
            <Link key={s.href} href={s.href} className="adm-hoja group flex flex-col gap-3 p-5">
              <span className="flex items-center justify-between text-[var(--texto-menor)]">
                <Icono nombre={s.icono} className="h-5 w-5" />
                <span className="adm-micro">{s.numero}</span>
              </span>
              <span>
                <b className="block text-lg font-medium leading-tight [font-family:var(--fuente-titulo)]">{s.nombre}</b>
                <span className="mt-1 block text-sm leading-snug text-[var(--texto-menor)] first-letter:uppercase">{s.pregunta}.</span>
              </span>
              <span className="adm-micro mt-auto transition-transform duration-200 group-hover:translate-x-1">entrar →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
