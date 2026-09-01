import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from './config.js';

// Solo lo que la fábrica necesita leer/escribir. Ver supabase/CONTRATO.md
// para la propiedad de escritura completa de cada tabla.
export type Narrador = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  contexto: {
    arbol?: {
      padres?: string[];
      hermanos?: string[];
      conyuge?: string[];
      hijos?: string[];
    };
    [clave: string]: unknown;
  };
  foto_url: string | null;
  estado: string;
};

export type Pregunta = {
  narrador_id: string | null; // null = pregunta fija global
  orden: number;
  texto: string;
  capitulo: string;
  tipo: 'fija' | 'adaptativa';
};

export type Respuesta = {
  narrador_id: string;
  pregunta_orden: number;
  texto_directo: string | null;
  transcripcion: string | null;
  es_repregunta: boolean;
  audio_path: string | null;
  duracion_segundos: number | null;
};

let cliente: SupabaseClient | undefined;

export function obtenerClienteDb(): SupabaseClient {
  if (!cliente) {
    const config = cargarConfig();
    cliente = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return cliente;
}
