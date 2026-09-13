import { redirect } from "next/navigation";

// "Preguntas" dejó de ser una sección (decisión del 13/09, docs/panel-usuario.md
// §15.3): el guion se edita desde la historia. Los links viejos siguen andando.
export default async function PaginaPreguntas({ params, searchParams }: PageProps<"/tablero/[narradorId]/preguntas">) {
  const { narradorId } = await params;
  const { sobre } = await searchParams;
  const extra = typeof sobre === "string" ? `&sobre=${encodeURIComponent(sobre)}` : "";
  redirect(`/tablero/${narradorId}?editar=1${extra}`);
}
