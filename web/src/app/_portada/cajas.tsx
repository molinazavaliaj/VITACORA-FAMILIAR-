import Image from "next/image";
import Link from "next/link";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import type { Caja, TapaCaja } from "./datos-cajas";

// La tienda como una librería: arriba los libros en un estante, con su etiqueta
// colgada, y abajo un índice, como el de un libro, con una línea por producto.
// Es server component: Biógrafo se abre con <details>, sin JS.
export function Cajas({ idioma, cajas, whatsapp }: { idioma: IdiomaWeb; cajas: Caja[]; whatsapp: string | null }) {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  return (
    <>
      <div className="acu-estante">
        <div className="acu-estante-fila">
          {cajas.map((c) => (
            <a key={c.id} href={`#caja-${c.id}`} className="acu-estante-item">
              {c.marca ? <span className={`acu-marca${c.marca === "pronto" ? " acu-marca--gris" : ""}`}>{t.marcas[c.marca]}</span> : null}
              <span className="acu-foto">{c.tapa ? <Tapa tapa={c.tapa} /> : null}</span>
              <span className="acu-etiqueta">{c.textos.titulo}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="acu-indice">
        {cajas.map((c) => (
          <article key={c.id} id={`caja-${c.id}`} className={`acu-fila${c.marca === "regalo" ? " acu-fila--regalo" : ""}`}>
            <div className="acu-fila-nombre">
              <h3>{c.textos.titulo}</h3>
              <p>{c.textos.linea}</p>
            </div>
            <p className="acu-ideal">
              <span className={`acu-resalta acu-resalta-${c.tinte}`}>{c.textos.ideal}</span>
            </p>
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
          </article>
        ))}
      </div>
    </>
  );
}

function Tapa({ tapa }: { tapa: TapaCaja }) {
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
