import type { Metadata } from "next";
import { PaginaNoEncontrada } from "./_publico/hoja-aviso";

// El 404 de toda la web (rediseño 2026-10, fase 3, maqueta `Casos` 5).
// La ruta que no existe no trae idioma, así que esta va en castellano, y es
// estática (sin headers ni cookies, cero JS propio). Los textos sirven igual
// para España y Argentina: no hay tú ni vos, y los enlaces van a «/» y a
// «/comprar», que ya mandan a /ar a quien llega de fuera de Europa
// (next.config.ts). Lo que cae bajo /ca/... o /ar/... tiene su propio 404 en
// su idioma (app/ca/not-found.tsx, app/ar/not-found.tsx).
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NoEncontrada() {
  return <PaginaNoEncontrada idioma="es" />;
}
