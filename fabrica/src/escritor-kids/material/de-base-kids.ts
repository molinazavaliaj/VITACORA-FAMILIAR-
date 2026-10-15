// Las filas de un chico desde la base (Supabase), con el mismo formato que los fijos: la fila de kids_v2, la del
// narrador, sus respuestas con clave_kids (las null no, las «∅» las saca materialDeFilas) y sus fotos. Mismo
// estilo que escritor/material/de-base.ts. No escribe nada.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FilaFotoKids, FilaKidsV2, FilaNarradorKids, FilaRespuestaKids, FilasKids } from './tipos.js';

export async function leerFilasKids(db: SupabaseClient, narradorId: string): Promise<FilasKids | null> {
  const k = await db.from('kids_v2').select('narrador_id,idioma,ficha,correcciones,termino_at').eq('narrador_id', narradorId).maybeSingle();
  if (k.error) throw new Error(`No pude leer kids_v2 de ${narradorId}: ${k.error.message}`);
  if (!k.data) return null;

  const n = await db.from('narradores').select('id,nombre,como_le_dicen').eq('id', narradorId).maybeSingle();
  if (n.error) throw new Error(`No pude leer el narrador ${narradorId}: ${n.error.message}`);
  if (!n.data) throw new Error(`kids_v2 tiene a ${narradorId} pero narradores no`);

  const r = await db
    .from('respuestas')
    .select('id,pregunta_orden,audio_path,texto_directo,transcripcion,reservada,recibido_at,clave_kids')
    .eq('narrador_id', narradorId)
    .not('clave_kids', 'is', null)
    .order('pregunta_orden', { ascending: true });
  if (r.error) throw new Error(`No pude leer las respuestas de ${narradorId}: ${r.error.message}`);

  const f = await db.from('fotos').select('*').eq('narrador_id', narradorId).order('orden', { ascending: true });
  if (f.error) throw new Error(`No pude leer las fotos de ${narradorId}: ${f.error.message}`);

  return {
    kids: k.data as unknown as FilaKidsV2,
    narrador: n.data as unknown as FilaNarradorKids,
    respuestas: (r.data ?? []) as unknown as FilaRespuestaKids[],
    fotos: (f.data ?? []) as unknown as FilaFotoKids[],
  };
}
