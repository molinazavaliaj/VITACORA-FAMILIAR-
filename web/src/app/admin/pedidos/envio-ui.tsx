import { Chip, type Color } from "../ui";
import type { EstadoEnvio } from "@/lib/pedidos-admin";

// El estado del envío, en palabras de quien despacha (la familia ve otras: estadoEnHumano).

const ENVIO: Record<EstadoEnvio, { texto: string; color: Color } | null> = {
  sin_direccion: { texto: "sin dirección", color: "neutro" },
  lista: { texto: "espera el libro", color: "neutro" },
  en_produccion: { texto: "en imprenta", color: "ambar" },
  impreso: { texto: "para despachar", color: "ambar" },
  enviado: { texto: "enviado", color: "verde" },
  entregado: { texto: "entregado", color: "verde" },
  con_problema: { texto: "con problema", color: "rojo" },
  sin_fila: { texto: "falta la entrega", color: "rojo" },
  nada: null,
};

export function ChipEnvio({ estado }: { estado: EstadoEnvio }) {
  const e = ENVIO[estado];
  if (!e) return <span className="text-[var(--texto-menor)]">sin envío</span>;
  return <Chip color={e.color}>{e.texto}</Chip>;
}
