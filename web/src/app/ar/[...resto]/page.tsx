import { notFound } from "next/navigation";

// Cualquier /ar/... que no sea una pantalla: sin esto, Next mostraría el 404 de
// la raíz (en castellano y con enlaces a la versión de España). Las rutas que
// existen ganan siempre a esta (es la de menor prioridad).
export default function Resto() {
  notFound();
}
