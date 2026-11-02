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
import { Chip, fechaCorta, Nota, Punto, SinDatos, Titulo, tono } from "../ui";
import { BotonTodosVistos, BotonVisto } from "./botones";

// 02 · Notificaciones — «qué nos avisaron los robots». Los mismos avisos que llegan por
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

  // La pastilla elegida se marca con aria-current (panel.css la pinta de tinta).
  const elegida = (activa: boolean) => (activa ? ("true" as const) : undefined);

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/notificaciones">
        Los mismos mails que les mandan la web, el entrevistador y la fábrica, juntos y por día. Los que no llegaron a
        salir por mail van marcados en rojo: esos sólo se ven acá.
      </Titulo>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={filtroAUrl({ ...filtro, de: null })} className="adm-pastilla" aria-current={elegida(filtro.de === null)}>
            todos
          </Link>
          {SERVICIOS.map((s) => (
            <Link key={s} href={filtroAUrl({ ...filtro, de: s })} className="adm-pastilla" aria-current={elegida(filtro.de === s)}>
              {NOMBRE_SERVICIO[s].toLowerCase()}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-[var(--linea-fuerte)]" />
          <Link href={filtroAUrl({ ...filtro, soloSinVer: !filtro.soloSinVer })} className="adm-pastilla" aria-current={elegida(filtro.soloSinVer)}>
            sólo sin ver{sinVer > 0 ? ` (${sinVer})` : ""}
          </Link>
        </div>
        <BotonTodosVistos cuantos={sinVer} />
      </div>

      {error ? (
        <p className="adm-alerta mt-5">{error}</p>
      ) : null}

      <div className="mt-8">
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
          <section key={dia} className="mb-8">
            <h2 className="adm-micro mb-3">
              <span className="flex items-center gap-2.5">
                {fechaCorta(dia, true)} <span className="adm-chip adm-tono-neutro">{delDia.length}</span>
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {delDia.map((a) => {
                const mail = estadoDelMail(a.salio_mail);
                const visto = a.visto_at !== null;
                return (
                  <details
                    key={a.id}
                    className={`adm-desplegable adm-hoja adm-hoja--viva px-5 py-4 ${
                      visto ? "opacity-70" : `adm-filo ${tono(mail.color === "rojo" ? "rojo" : "ambar")}`
                    }`}
                  >
                    <summary className="flex cursor-pointer flex-wrap items-start gap-3">
                      <span aria-hidden className="adm-flecha pt-0.5 text-[var(--texto-menor)]">
                        ›
                      </span>
                      <span className="pt-1.5">
                        <Punto color={visto ? "neutro" : mail.color === "rojo" ? "rojo" : "ambar"} />
                      </span>
                      <span className="flex-1">
                        <b className="block font-medium leading-snug">{a.asunto}</b>
                        <span className="text-sm text-[var(--texto-suave)]">{NOMBRE_SERVICIO[a.servicio] ?? a.servicio}</span>
                      </span>
                      <Chip color={mail.color}>{mail.texto}</Chip>
                      <span className="adm-dato whitespace-nowrap pt-0.5 text-xs text-[var(--texto-menor)]">{horaDe(a.creado_at)}</span>
                    </summary>
                    <div className="mt-4 border-t border-[var(--linea)] pt-4">
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
