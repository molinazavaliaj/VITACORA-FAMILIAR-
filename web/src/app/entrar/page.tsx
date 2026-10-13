import { Suspense } from "react";
import { headers } from "next/headers";
import FormularioEntrar from "./formulario";
import { regionDelRequest } from "@/lib/region";
import { tratoDeRegion } from "@/lib/regalo-textos";

export default async function Entrar() {
  // Todavía no hay familia: el trato sale del país de quien entra.
  const trato = tratoDeRegion(regionDelRequest(await headers()));
  // useSearchParams en el formulario (?volver=) pide un Suspense por encima.
  return (
    <Suspense>
      <FormularioEntrar trato={trato} />
    </Suspense>
  );
}
