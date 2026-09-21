import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from './config.js';

// Solo lo que la fábrica necesita leer/escribir. Ver supabase/CONTRATO.md
// para la propiedad de escritura completa de cada tabla.
export type Narrador = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  contexto: {
    // El árbol NO son listas: la web lo guarda como texto libre por vínculo,
    // tal cual lo escribió la familia en el formulario ("Ramón y Haydée",
    // "Claudia, Sergio y la Vanesa", o "no tuvo" cuando no hubo). Ver
    // web/src/lib/registro.ts. Tratarlo como array lo desarma letra por letra.
    arbol?: {
      padres?: string;
      hermanos?: string;
      conyuge?: string;
      hijos?: string;
    };
    [clave: string]: unknown;
  };
  foto_url: string | null;
  estado: string;
  familia_id: string;
  /** jsonb que escribe la web con la edición final; lo interpreta `libro/edicion.ts`. */
  edicion: unknown;
  /** "Cerrar libro": sin esto no se produce nada. Lo escribe la web, o la fábrica a los 30 días. */
  libro_aprobado_at: string | null;
  ultima_respuesta_at: string | null;
};

export type Pregunta = {
  narrador_id: string | null; // null = pregunta fija global
  orden: number;
  texto: string;
  capitulo: string;
  tipo: 'fija' | 'adaptativa' | 'familia' | 'sugerida';
};

export type Respuesta = {
  id: string;
  narrador_id: string;
  pregunta_orden: number;
  texto_directo: string | null;
  transcripcion: string | null;
  es_repregunta: boolean;
  audio_path: string | null;
  duracion_segundos: number | null;
  /** Cuándo llegó el audio: desempata las repreguntas de un mismo día en narracion.json. */
  recibido_at: string | null;
  /**
   * El narrador pidió que esta respuesta no vaya al libro (hallazgo 19; migración
   * `20260920000100`, la aplica Naza cuando Joaquín dé el OK). Opcionales a
   * propósito: con `select *` no vienen hasta que la migración esté aplicada, y
   * ausente = nada reservado, así la fábrica funciona igual antes y después.
   */
  reservada?: boolean | null;
  /** Si el pedido es por una parte: el tramo textual que no se publica. */
  reservado_tramo?: string | null;
  /**
   * La marca del tema REAL: la `orden` de la pregunta cuyo tema trata de verdad
   * esta respuesta. La escribe el entrevistador (lo hace Joaquín) cuando el
   * narrador contesta una pregunta y adentro cuenta una historia que pertenece a
   * otro tema — el caso del piloto: contesta la 9 y la historia es de la 2.
   * Migración pendiente (la aplica Naza cuando los dos socios acuerden).
   *
   * Opcionales a propósito, igual que `reservada`: con `select *` no vienen
   * hasta que la migración esté aplicada, y ausente = sin marca, así la fábrica
   * da exactamente el mismo libro antes y después de aplicarla.
   */
  tema_de_orden?: number | null;
  /** Una línea de por qué el modelo dice que el tema es otro. La fábrica no la publica: es para que la familia entienda la marca. */
  tema_motivo?: string | null;
};

export type Foto = {
  id: string;
  narrador_id: string;
  capitulo: string;
  storage_path: string;
  epigrafe: string | null;
  principal: boolean;
  orden: number;
  /**
   * 'arriba' (default) o 'abajo'; solo importa en la principal (CONTRATO,
   * migración 20260918). Opcionales a propósito, igual que `reservada` en
   * Respuesta: con `select *` no vienen hasta que la migración esté aplicada, y
   * ausente = 'arriba' y sin recorte, así el libro sale igual antes y después.
   */
  posicion?: string | null;
  /** jsonb `{x, y}` en 0..1: el punto que queda a la vista al recortar. Se normaliza en fotos.ts. */
  foco?: unknown;
};

let cliente: SupabaseClient | undefined;

export function obtenerClienteDb(): SupabaseClient {
  if (!cliente) {
    const config = cargarConfig();
    cliente = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return cliente;
}
