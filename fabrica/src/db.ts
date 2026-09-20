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
};

export type Foto = {
  id: string;
  narrador_id: string;
  capitulo: string;
  storage_path: string;
  epigrafe: string | null;
  principal: boolean;
  orden: number;
  /** 'arriba' (default) o 'abajo'; solo importa en la principal (CONTRATO, migración 20260918). */
  posicion: string | null;
  /** jsonb `{x, y}` en 0..1: el punto que queda a la vista al recortar. Se normaliza en fotos.ts. */
  foco: unknown;
};

let cliente: SupabaseClient | undefined;

export function obtenerClienteDb(): SupabaseClient {
  if (!cliente) {
    const config = cargarConfig();
    cliente = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return cliente;
}
