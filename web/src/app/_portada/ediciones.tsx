import Image from "next/image";
import Link from "next/link";
import { TEXTOS_EDICIONES } from "../_textos/ediciones";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { LIBRO_VIAJE_EJEMPLO } from "../_textos/viaje";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";

// «Nuestras ediciones» (maqueta aprobada por Naza el 02/11): como una tienda,
// cuatro fichas iguales y a la vista a la vez, sin destacar ninguna. La foto
// es siempre el mismo plano: el libro cerrado, de frente, en el mismo fondo de
// estudio y con la misma luz; la tapa es la de la web (foto arriba, banda
// abajo, como Libro3D) y la de Viaje es apaisada, con la banda de tinta. Al
// pasar el mouse aparece la escena (en el teléfono no: queda el libro).
//
// Precio: el mismo de cada página (el de la portada es el del libro impreso;
// el de Viaje, PRECIO_VIAJE_*). Sin precio no va ningún número; Kids e Historia
// todavía no se venden y llevan «Próximamente». Estilos en portada.css (prt-ed-).

type Tapa = { etiqueta: string; nombre: [string, string] | string; firma: string; foto: string; encuadre?: string };
type Ficha = {
  id: string;
  href: string;
  nombre: string;
  para: string;
  tapa: Tapa;
  escena: string;
  encuadreEscena?: string;
  apaisado?: boolean;
  precio: string | null;
  proximamente?: boolean;
};

export function Ediciones({ idioma, precioFamiliar, precioViaje }: { idioma: IdiomaWeb; precioFamiliar: string | null; precioViaje: string | null }) {
  const t = TEXTOS_EDICIONES[idioma];
  const familiar = TEXTOS_PORTADA[idioma].direccion.libro;
  const fichas: Ficha[] = [
    {
      id: "familiar",
      href: ruta(idioma, "/ejemplo"),
      ...t.familiar,
      tapa: { etiqueta: familiar.etiqueta, nombre: familiar.nombre, firma: familiar.paraSiempre, foto: "/rediseno/juan-domingo-tapa-foto.jpg" },
      escena: "/rediseno/familia-con-el-libro.jpg",
      precio: precioFamiliar,
    },
    {
      id: "viaje",
      href: ruta(idioma, "/viaje"),
      ...t.viaje,
      tapa: {
        etiqueta: LIBRO_VIAJE_EJEMPLO.etiqueta,
        nombre: LIBRO_VIAJE_EJEMPLO.nombre.join(" "),
        firma: LIBRO_VIAJE_EJEMPLO.paraSiempre,
        foto: "/rediseno/viaje-mirador-lisboa.jpg",
      },
      escena: "/rediseno/viaje-alfama-tranvia.jpg",
      apaisado: true,
      precio: precioViaje,
    },
    {
      id: "kids",
      href: ruta(idioma, "/kids"),
      ...t.kids,
      tapa: { etiqueta: t.tapaKids.etiqueta, nombre: t.tapaKids.nombre, firma: t.tapaKids.edad, foto: "/rediseno/kids-cuarto-juguetes.jpg" },
      escena: "/rediseno/kids-familia-sofa.jpg",
      encuadreEscena: "40% 50%",
      precio: null,
      proximamente: true,
    },
    {
      id: "historia",
      href: ruta(idioma, "/historia"),
      ...t.historia,
      tapa: { ...t.tapaHistoria, foto: "/rediseno/historia-empresa-tapa.jpg" },
      escena: "/rediseno/historia-empresa-libro.jpg",
      precio: null,
      proximamente: true,
    },
  ];

  return (
    <div className="prt-ed mx-auto flex max-w-[1160px] flex-col gap-6">
      <div className="prt-ed-cabeza aparece">
        <h2 className="dir-titular">{t.titulo}</h2>
        <span>{t.bajada}</span>
      </div>

      <ul className="prt-ed-grilla">
        {fichas.map((f) => (
          <li key={f.id} className="aparece">
            <Link prefetch={false} href={f.href} className="prt-ed-ficha">
              <div className="prt-ed-foto">
                <div className={`prt-ed-libro${f.apaisado ? " prt-ed-libro--apaisado" : ""}`}>
                  <div className={`prt-ed-tapa${f.apaisado ? " prt-ed-tapa--viaje" : ""}`}>
                    <div className="prt-ed-tapa-foto">
                      <Image
                        src={f.tapa.foto}
                        alt=""
                        fill
                        sizes={f.apaisado ? "(min-width: 860px) 230px, 40vw" : "(min-width: 860px) 160px, 28vw"}
                        style={{ objectPosition: f.tapa.encuadre ?? "50% 40%" }}
                      />
                    </div>
                    <div className="prt-ed-tapa-banda">
                      <span className="prt-ed-et">{f.tapa.etiqueta}</span>
                      <span className="prt-ed-nom">
                        {Array.isArray(f.tapa.nombre) ? (
                          <>
                            {f.tapa.nombre[0]}
                            <br />
                            {f.tapa.nombre[1]}
                          </>
                        ) : (
                          f.tapa.nombre
                        )}
                      </span>
                      <span className="prt-ed-abajo">
                        <span className="prt-ed-firma">{f.tapa.firma}</span>
                        <span className="prt-ed-vf">V · F</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Image
                  src={f.escena}
                  alt=""
                  fill
                  sizes="(min-width: 860px) 280px, 46vw"
                  className="prt-ed-escena"
                  style={f.encuadreEscena ? { objectPosition: f.encuadreEscena } : undefined}
                />
                {f.proximamente ? <span className="prt-ed-marca">{t.proximamente}</span> : null}
                <span aria-hidden className="prt-ed-mira">
                  {t.mira}
                </span>
              </div>
              <div className="flex flex-col gap-[3px]">
                <h3 className="prt-ed-nombre">{f.nombre}</h3>
                <p className="prt-ed-para">{f.para}</p>
                {f.precio ? <p className="prt-ed-precio">{f.precio}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <ul className="prt-ed-pie aparece">
        {t.pie.map((p) => (
          <li key={p}>
            <svg viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3 3 7-7" />
            </svg>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
