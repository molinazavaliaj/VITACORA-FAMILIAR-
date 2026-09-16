import Link from "next/link";
import type { ReactNode } from "react";
import { ACTUALIZADO, CONTACTO, type Titular, faltan } from "./titulares";

// La maqueta de las páginas legales, en un solo lugar: columna angosta, texto
// chico y aireado, títulos discretos. Las tres páginas (términos, privacidad,
// arrepentimiento) usan estas piezas y nada más, así se ven iguales y cambiar
// el estilo es tocar acá.

export function Pagina({ titulo, bajada, children }: { titulo: string; bajada: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">{titulo}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{bajada}</p>
        <p className="mt-1 text-xs text-zinc-500">Última actualización: {ACTUALIZADO}</p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
        <p className="mt-12 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500">
          ¿Dudas, una devolución, o quieres que borremos algo? Escribe a <Correo cual="hola" /> y te
          respondemos.
        </p>
      </div>
    </div>
  );
}

export function Seccion({ id, titulo, children }: { id?: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-base font-medium text-zinc-900">{titulo}</h2>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function Parrafo({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-zinc-700">{children}</p>;
}

export function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-zinc-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Enlace({ href, children }: { href: string; children: ReactNode }) {
  const clase = "underline decoration-zinc-300 underline-offset-2";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={clase}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={clase} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
      {children}
    </a>
  );
}

export function Correo({ cual }: { cual: keyof typeof CONTACTO }) {
  const direccion = CONTACTO[cual];
  return <Enlace href={`mailto:${direccion}`}>{direccion}</Enlace>;
}

/** Un dato que los socios todavía tienen que completar. Se ve, a propósito. */
export function Pendiente({ etiqueta }: { etiqueta: string }) {
  return <span className="bg-amber-100 px-1">[{etiqueta}]</span>;
}

/** Nombre, documento y domicilio de un titular, con lo que falte en amarillo. */
export function DatosTitular({ titular }: { titular: Titular }) {
  const huecos = faltan(titular);
  return (
    <>
      <strong className="font-medium">{titular.nombre}</strong>, {titular.documento.etiqueta}{" "}
      {huecos.includes(titular.documento.etiqueta) ? (
        <Pendiente etiqueta="a completar" />
      ) : (
        titular.documento.valor
      )}
      , con domicilio en{" "}
      {huecos.includes("domicilio") ? <Pendiente etiqueta="a completar" /> : titular.domicilio}
    </>
  );
}

export function Tabla({ columnas, filas }: { columnas: string[]; filas: ReactNode[][] }) {
  return (
    <>
      {/* En pantallas angostas, cada fila es un bloque: la primera celda como título y el resto etiquetado. */}
      <div className="flex flex-col gap-4 sm:hidden">
        {filas.map((fila, i) => (
          <div key={i} className="border-b border-zinc-100 pb-4 text-sm leading-relaxed text-zinc-700">
            <p className="font-medium text-zinc-900">{fila[0]}</p>
            {fila.slice(1).map((celda, j) => (
              <p key={j} className="mt-1">
                <span className="text-xs uppercase tracking-wide text-zinc-500">{columnas[j + 1]}: </span>
                {celda}
              </p>
            ))}
          </div>
        ))}
      </div>
      <table className="hidden w-full border-collapse text-left text-sm leading-relaxed text-zinc-700 sm:table">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c} scope="col" className="border-b border-zinc-200 px-1 pb-2 align-bottom text-xs font-medium uppercase tracking-wide text-zinc-500">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="align-top">
              {fila.map((celda, j) => (
                <td key={j} className="border-b border-zinc-100 px-1 py-2">
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
