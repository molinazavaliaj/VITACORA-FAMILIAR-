import FormularioEntrar from "./formulario";

export default function Entrar() {
  const urlBase = process.env.URL_BASE || "http://localhost:3000";

  return <FormularioEntrar urlBase={urlBase} />;
}
