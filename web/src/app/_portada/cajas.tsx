import Image from "next/image";
import Link from "next/link";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import type { Caja } from "./datos-cajas";

// La tienda: la fila de atajos y las cajitas. Es server component: Biógrafo se
// abre con <details>, sin JS.
export function Cajas({ idioma, cajas, whatsapp }: { idioma: IdiomaWeb; cajas: Caja[]; whatsapp: string | null }) {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  return (
    <>
      <nav className="acu-ruta" aria-label={t.inicio.boton}>
        {cajas.map((c) => (
          <a key={c.id} href={`#caja-${c.id}`} className={`acu-tinte-${c.tinte}`}>
            <small>{t.atajos[c.id].pista}</small>
            {t.atajos[c.id].nombre}
          </a>
        ))}
      </nav>
      <div className={`acu-cajas${cajas.length === 5 ? " acu-cajas--fila" : ""}`}>
        {cajas.map((c) => (
          <article key={c.id} id={`caja-${c.id}`} className={`acu-caja${c.marca === "regalo" ? " acu-caja--regalo" : ""}`}>
            {c.marca ? <span className={`acu-marca${c.marca === "pronto" ? " acu-marca--gris" : ""}`}>{t.marcas[c.marca]}</span> : null}
            <div className={`acu-foto acu-tinte-${c.tinte}`}>
              {c.tapa ? (
                <div className={`prt-ed-libro${c.tapa.apaisado ? " prt-ed-libro--apaisado" : ""}`}>
                  <div className={`prt-ed-tapa${c.tapa.apaisado ? " prt-ed-tapa--viaje" : ""}`}>
                    <div className="prt-ed-tapa-foto">
                      <Image src={c.tapa.foto} alt="" fill sizes="(min-width: 640px) 170px, 34vw" style={{ objectPosition: "50% 40%" }} />
                    </div>
                    <div className="prt-ed-tapa-banda">
                      <span className="prt-ed-et">{c.tapa.etiqueta}</span>
                      <span className="prt-ed-nom">
                        {Array.isArray(c.tapa.nombre) ? (
                          <>
                            {c.tapa.nombre[0]}
                            <br />
                            {c.tapa.nombre[1]}
                          </>
                        ) : (
                          c.tapa.nombre
                        )}
                      </span>
                      <span className="prt-ed-abajo">
                        <span className="prt-ed-firma">{c.tapa.firma}</span>
                        <span className="prt-ed-vf">V · F</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="acu-cuerpo">
              <h3>{c.textos.titulo}</h3>
              <p>{c.textos.linea}</p>
              <p className={`acu-ideal acu-tinte-${c.tinte}`}>{c.textos.ideal}</p>
              <dl className="acu-precios">
                {c.filas.map((f) => (
                  <div key={f.etiqueta}>
                    <dt>{f.etiqueta}</dt>
                    <dd>{f.valor}</dd>
                  </div>
                ))}
              </dl>
              {c.href ? (
                <Link prefetch={false} href={c.href} className="acu-ir">
                  {c.textos.enlace} <span aria-hidden>→</span>
                </Link>
              ) : (
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
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
