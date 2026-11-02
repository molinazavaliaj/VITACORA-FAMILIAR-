import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import {
  estadoDelMail,
  filtroDe,
  horaDe,
  leerAvisos,
  NOMBRE_SERVICIO,
  porDia,
  SERVICIOS,
  TOPE_AVISOS,
  type Filtro,
} from "@/lib/admin/notificaciones";
import { Chip, fechaCorta, Nota, Punto, SinDatos, Titulo } from "../ui";
import { BotonTodosVistos, BotonVisto } from "./botones";

// 08 · Notificaciones — «qué nos avisaron los robots». Los mismos avisos que llegan por
// mail a MAIL_SOCIOS (cada servicio los anota en `avisos` cuando los manda), para verlos
// juntos acá, con los que no salieron por mail a la vista.

const filtroAUrl = (f: Filtro): string => {
  const p = new URLSearchParams();
  if (f.de) p.set("de", f.de);
  if (f.soloSinVer) p.set("ver", "sin-ver");
  const q = p.toString();
  return q ? `/admin/notificaciones?${q}` : "/admin/notificaciones";
};

export default async function PantallaNotificaciones({ searchParams }: PageProps<"/admin/notificaciones">) {
  const filtro = filtroDe(await searchParams);
  const { avisos, sinVer, error } = await leerAvisos(crearClienteServidor(), filtro);
  const dias = porDia(avisos);

  const pastilla = (activa: boolean) =>
    `rounded-full border px-3 py-0.5 text-xs ${
      activa
        ? "border-[var(--acento)] bg-[var(--acento)] text-[var(--sobre-acento)]"
        : "border-[var(--linea-fuerte)] text-[var(--texto-suave)] hover:bg-[var(--hueco)]"
    }`;

  return (
    <div>
      <Titulo numero="08" nombre="Notificaciones" aclara="qué nos avisaron los robots" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={filtroAUrl({ ...filtro, de: null })} className={pastilla(filtro.de === null)}>
            todos
          </Link>
          {SERVICIOS.map((s) => (
            <Link key={s} href={filtroAUrl({ ...filtro, de: s })} className={pastilla(filtro.de === s)}>
              {NOMBRE_SERVICIO[s].toLowerCase()}
            </Link>
          ))}
          <span className="mx-1 text-[var(--linea-fuerte)]">·</span>
          <Link href={filtroAUrl({ ...filtro, soloSinVer: !filtro.soloSinVer })} className={pastilla(filtro.soloSinVer)}>
            sólo sin ver{sinVer > 0 ? ` (${sinVer})` : ""}
          </Link>
        </div>
        <BotonTodosVistos cuantos={sinVer} />
      </div>

      {error ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">{error}</p>
      ) : null}

      <div className="mt-5">
        {!error && dias.length === 0 ? (
          <SinDatos
            que={
              filtro.soloSinVer
                ? "No queda ningún aviso sin ver."
                : "Todavía no llegó ningún aviso: cuando un robot les mande un mail, también aparece acá."
            }
          />
        ) : null}

        {dias.map(({ dia, avisos: delDia }) => (
          <section key={dia} className="mb-6">
            <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
              {fechaCorta(dia, true)} <span className="text-[var(--texto)]">{delDia.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {delDia.map((a) => {
                const mail = estadoDelMail(a.salio_mail);
                const visto = a.visto_at !== null;
                return (
                  <details
                    key={a.id}
                    className={`rounded border border-[var(--linea)] px-4 py-3 ${visto ? "opacity-70" : ""}`}
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-start gap-3">
                      <span className="pt-1.5">
                        <Punto color={visto ? "neutro" : mail.color === "rojo" ? "rojo" : "ambar"} />
                      </span>
                      <span className="flex-1">
                        <b className="block">{a.asunto}</b>
                        <span className="text-sm text-[var(--texto-suave)]">{NOMBRE_SERVICIO[a.servicio] ?? a.servicio}</span>
                      </span>
                      <Chip color={mail.color}>{mail.texto}</Chip>
                      <span className="whitespace-nowrap text-xs text-[var(--texto-menor)]">{horaDe(a.creado_at)}</span>
                    </summary>
                    <div className="mt-3 border-t border-[var(--linea)] pt-3">
                      {a.detalle ? (
                        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)]">
                          {a.detalle}
                        </pre>
                      ) : (
                        <p className="text-sm text-[var(--texto-menor)]">Sin detalle.</p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-[var(--texto-menor)]">
                          {visto ? `Visto el ${fechaCorta(a.visto_at, true)} a las ${horaDe(a.visto_at!)}.` : "Sin ver."}
                        </span>
                        {visto ? null : <BotonVisto id={a.id} />}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Nota>
        Son los mismos avisos que les llegan por mail. Cada servicio (la web, el entrevistador y la fábrica) los anota
        acá en el mismo momento en que manda el mail, así que también aparecen los que no salieron: esos van en rojo.
        Se muestran los últimos {TOPE_AVISOS}. Marcar como visto no cambia nada afuera del panel.
      </Nota>
    </div>
  );
}
