// Las pantallas del panel, en un solo lugar: la navegación, el encabezado de cada pantalla
// y el recorrido de la pantalla de Estado salen de acá, así un nombre o un número no puede
// decir una cosa en la barra y otra en el título.
//
// Van agrupadas por lo que se viene a mirar (rediseño 02/11): primero lo de hoy, después
// las historias, los números, la máquina y la marca. El número sigue ese orden.

export type Grupo = "Hoy" | "Las historias" | "Los números" | "La máquina" | "La marca";

export type Seccion = {
  href: string;
  numero: string;
  nombre: string;
  grupo: Grupo;
  /** La pregunta que contesta la pantalla: va debajo del título. */
  pregunta: string;
  /** Lo mismo en tres o cuatro palabras, para la barra lateral. */
  pista: string;
  icono: NombreIcono;
};

export const SECCIONES: Seccion[] = [
  { href: "/admin", numero: "01", nombre: "Estado", grupo: "Hoy", pregunta: "qué se frenó y qué hay que hacer hoy", pista: "lo urgente del día", icono: "estado" },
  { href: "/admin/notificaciones", numero: "02", nombre: "Notificaciones", grupo: "Hoy", pregunta: "qué nos avisaron los robots", pista: "los avisos por mail", icono: "notificaciones" },
  { href: "/admin/familias", numero: "03", nombre: "Familias", grupo: "Las historias", pregunta: "la relación con el biógrafo, historia por historia", pista: "cada entrevista, día por día", icono: "familias" },
  { href: "/admin/kids", numero: "04", nombre: "Kids", grupo: "Las historias", pregunta: "cómo va cada chico y qué marcó el motor", pista: "cómo va cada chico", icono: "kids" },
  { href: "/admin/creadores", numero: "05", nombre: "Creadores", grupo: "Las historias", pregunta: "quién se anotó, quién vende y cuánto se les debe", pista: "altas, ventas y comisiones", icono: "creadores" },
  { href: "/admin/plata", numero: "06", nombre: "Plata", grupo: "Los números", pregunta: "lo que entró, lo que se gastó y lo que quedó", pista: "entró, salió, quedó", icono: "plata" },
  { href: "/admin/gastos", numero: "07", nombre: "Gastos", grupo: "Los números", pregunta: "qué se gastó, día por día y paso por paso", pista: "en qué se va la plata", icono: "gastos" },
  { href: "/admin/cerebros", numero: "08", nombre: "Cerebros", grupo: "La máquina", pregunta: "qué cerebro trabaja, qué hace y dónde se frenó", pista: "qué robot trabaja", icono: "cerebros" },
  { href: "/admin/contenido", numero: "09", nombre: "Contenido", grupo: "La marca", pregunta: "qué publicamos y cuándo", pista: "el calendario de redes", icono: "contenido" },
];

export const GRUPOS: Grupo[] = ["Hoy", "Las historias", "Los números", "La máquina", "La marca"];

/** La sección de una ruta. Una ruta que no está (no debería pasar) cae en Estado. */
export function seccionDe(href: string): Seccion {
  return SECCIONES.find((s) => s.href === href) ?? SECCIONES[0];
}

// ── Los íconos: trazos finos, del color del texto, en una grilla de 24 ──────────

export type NombreIcono =
  | "estado"
  | "notificaciones"
  | "familias"
  | "kids"
  | "creadores"
  | "plata"
  | "gastos"
  | "cerebros"
  | "contenido"
  | "salir";

const TRAZOS: Record<NombreIcono, string[]> = {
  estado: ["M3 12h4l2.2-5.5 4.6 11 2.2-5.5H21"],
  notificaciones: ["M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15z", "M10 20.5a2 2 0 0 0 4 0"],
  familias: ["M4 11 12 4.5l8 6.5v8.5a1 1 0 0 1-1 1h-4.5v-5.5h-5V20.5H5a1 1 0 0 1-1-1z"],
  kids: ["M12 3.8l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"],
  creadores: ["M4 9.5v5l11 4.5v-14z", "M15 9a3 3 0 0 1 0 6", "M7 15.5l1.2 4h3l-1-3.2"],
  plata: [
    "M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16",
    "M14.6 9.6c-.5-.9-1.5-1.4-2.6-1.4-1.4 0-2.5.8-2.5 1.9s1.1 1.6 2.5 1.9 2.5.8 2.5 2-1.1 1.9-2.5 1.9c-1.1 0-2.1-.5-2.6-1.4",
    "M12 6.6v1.6M12 15.8v1.6",
  ],
  gastos: ["M6 3.5h12v17l-3-2-3 2-3-2-3 2z", "M9 8h6M9 11.5h6M9 15h3.5"],
  cerebros: [
    "M8.5 6.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
    "M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3",
  ],
  contenido: ["M5.5 5.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z", "M3.5 10h17M8 3.5v4M16 3.5v4"],
  salir: ["M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4", "M10 16l-4-4 4-4M6 12h10"],
};

export function Icono({ nombre, className = "h-[18px] w-[18px]" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
