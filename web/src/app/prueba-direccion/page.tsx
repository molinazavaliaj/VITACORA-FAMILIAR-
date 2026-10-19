import { redirect } from "next/navigation";

// El prototipo de dirección visual (13–14/10) ya es la portada: quien tenga
// el enlace viejo va a /.

export default function PaginaPruebaDireccion() {
  redirect("/");
}
