import { redirect } from "next/navigation";

// El registro gratis del modelo viejo. Con el pago por adelantado (11/09) la
// única puerta es /comprar: acá no se crea nada, se redirige. Se deja la ruta
// para que un link viejo no caiga en un 404.
export default function Registro() {
  redirect("/comprar");
}
