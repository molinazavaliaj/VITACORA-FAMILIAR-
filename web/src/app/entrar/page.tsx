import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import FormularioEntrar from "./formulario";
import { regionDelRequest } from "@/lib/region";
import { tratoDeRegion } from "@/lib/regalo-textos";
import { textosEntrar } from "../_textos/entrar";
import { Toroide } from "../marca";
import "./entrar.css";

// /entrar (rediseño 2026-10, arreglos chicos; maquetas `Entrar` y
// `EntrarMovil`). En escritorio, a la izquierda la foto de Osvaldo con la
// guitarra, como una foto de papel apoyada sobre la tinta; a la derecha el
// formulario. En el celular, solo el formulario (la maqueta no lleva foto).
// La entrada no cambia: código de 6 números al correo (formulario.tsx).

export default async function Entrar() {
  // Todavía no hay familia: el trato sale del país de quien entra.
  const trato = tratoDeRegion(regionDelRequest(await headers()));
  const t = textosEntrar(trato);
  return (
    <div className="dir-pagina dir-tinta ent">
      <figure className="ent-foto">
        <div className="ent-foto-papel">
          <div className="ent-foto-imagen">
            <Image src="/rediseno/osvaldo-guitarra.jpg" alt={t.altFoto} fill sizes="(min-width: 1024px) 45vw, 1px" className="object-cover" />
          </div>
          <figcaption className="ent-foto-pie">
            <span className="ent-foto-cita">{t.citaFoto}</span>
            <span className="ent-foto-quien">{t.pieFoto}</span>
          </figcaption>
        </div>
      </figure>
      <div className="ent-lado">
        <header className="ent-cabecera">
          <Link href="/" prefetch={false} aria-label="Vitácora" className="flex min-h-11 items-center gap-3">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="dir-micro tracking-[0.22em]">
              VITÁCORA
            </span>
          </Link>
          <Link href="/" prefetch={false} className="ent-volver">
            <span aria-hidden>←</span> {t.volver}
          </Link>
        </header>
        <main className="ent-cuerpo">
          {/* useSearchParams en el formulario (?volver=) pide un Suspense por encima. */}
          <Suspense>
            <FormularioEntrar trato={trato} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
