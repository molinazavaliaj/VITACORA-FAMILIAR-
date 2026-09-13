import { Suspense } from "react";
import FormularioEntrar from "./formulario";

export default function Entrar() {
  // useSearchParams en el formulario (?volver=) pide un Suspense por encima.
  return (
    <Suspense>
      <FormularioEntrar />
    </Suspense>
  );
}
