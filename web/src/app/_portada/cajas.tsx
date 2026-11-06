import Image from "next/image";
import Link from "next/link";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import type { Caja, TapaCaja } from "./datos-cajas";

// La tienda como una estantería: los libros en un mismo estante y, colgada abajo
// de cada uno, una nota de papel acuarela con sus datos.
// Es server component: Biógrafo se abre con <details>, sin JS.
export function Cajas({ idioma, cajas, whatsapp }: { idioma: IdiomaWeb; cajas: Caja[]; whatsapp: string | null }) {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  return (
    <div className={`acu-estante${cajas.length === 5 ? " acu-estante--cinco" : cajas.length === 1 ? " acu-estante--uno" : ""}`}>
      {cajas.map((c) => (
        <article key={c.id} id={`caja-${c.id}`} className={`acu-estante-item${c.marca === "regalo" ? " acu-estante-item--regalo" : ""}`}>
          {c.marca ? <span className={`acu-marca${c.marca === "pronto" ? " acu-marca--gris" : ""}`}>{t.marcas[c.marca]}</span> : null}
          <div className="acu-foto">{c.tapa ? <Tapa tapa={c.tapa} /> : null}</div>
          <div className={`acu-nota acu-tinte-${c.tinte}`}>
            <h3>{c.textos.titulo}</h3>
            <p>{c.textos.linea}</p>
            <p className="acu-ideal">{c.textos.ideal}</p>
            <dl className="acu-precios">
              {c.filas.map((f) => (
                <div key={f.etiqueta}>
                  <dt>{f.etiqueta}</dt>
                  <dd>
                    {f.antes ? <s className="acu-antes">{f.antes}</s> : null}
                    {f.valor}
                  </dd>
                </div>
              ))}
            </dl>
            {c.href && c.externo ? (
              <a href={c.href} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="acu-ir">
                {c.textos.enlace} <span aria-hidden>→</span>
              </a>
            ) : c.href ? (
              <Link prefetch={false} href={c.href} className="acu-ir">
                {c.textos.enlace} <span aria-hidden>→</span>
              </Link>
            ) : c.id === "biografo" ? (
              <details className="acu-biografo">
                <summary className="acu-ir">
                  {c.textos.enlace} <span aria-hidden>→</span>
                </summary>
                <div>
                  <span className="dir-micro">{t.biografo.etiqueta}</span>
                  <strong>{t.biografo.nombre}</strong>
                  <span>{t.biografo.rol}</span>
                  <p>{t.biografo.texto}</p>
                  {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.biografo.boton}</a> : null}
                </div>
              </details>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function Tapa({ tapa }: { tapa: TapaCaja }) {
  return (
    <span aria-hidden className={`prt-ed-libro${tapa.apaisado ? " prt-ed-libro--apaisado" : ""}`}>
      <span className={`prt-ed-tapa${tapa.apaisado ? " prt-ed-tapa--viaje" : ""}`}>
        <span className="prt-ed-tapa-foto">
          <Image src={tapa.foto} alt="" fill sizes="(min-width: 640px) 170px, 34vw" style={{ objectPosition: "50% 40%" }} />
        </span>
        <span className="prt-ed-tapa-banda">
          <span className="prt-ed-et">{tapa.etiqueta}</span>
          <span className="prt-ed-nom">
            {Array.isArray(tapa.nombre) ? (
              <>
                {tapa.nombre[0]}
                <br />
                {tapa.nombre[1]}
              </>
            ) : (
              tapa.nombre
            )}
          </span>
          <span className="prt-ed-abajo">
            <span className="prt-ed-firma">{tapa.firma}</span>
            <span className="prt-ed-vf">V · F</span>
          </span>
        </span>
      </span>
    </span>
  );
}
