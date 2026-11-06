import { crearClienteServidor } from "@/lib/supabase/servidor";
import { PASOS_EMBUDO, armarEmbudo, type FilaEmbudo, type PasoEmbudo } from "@/lib/embudo";
import { Nota, SinDatos, Titulo } from "../ui";

// 11 · Embudo — «cuánta gente llega a cada paso de la compra». Un contador por día, sin
// cookies ni datos de persona. El permiso lo pone el layout de /admin, igual que Pedidos.

export const dynamic = "force-dynamic";

const NOMBRE_PASO: Record<PasoEmbudo, string> = {
  entro: "Entró",
  para_quien: "Para quién",
  pago: "Pago",
  pagar: "Tocó pagar",
  pagado: "Pagó",
};
const NOMBRE_DISPOSITIVO = { celular: "celular", compu: "compu" } as const;

async function leerEmbudo(): Promise<{ ok: true; filas: FilaEmbudo[] } | { ok: false; sinMigracion: boolean }> {
  try {
    const desde = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await crearClienteServidor().from("embudo_compra").select("dia, compra, paso, region, dispositivo, cuenta").gte("dia", desde);
    if (error) return { ok: false, sinMigracion: /embudo_compra|does not exist|schema cache/i.test(error.message) };
    return { ok: true, filas: (data ?? []) as FilaEmbudo[] };
  } catch {
    return { ok: false, sinMigracion: false };
  }
}

export default async function PantallaEmbudo() {
  const r = await leerEmbudo();
  const lineas = r.ok ? armarEmbudo(r.filas) : [];
  const hayDatos = lineas.some((l) => l.cuentas.entro > 0);

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/embudo">
        Los últimos 30 días, por región y dispositivo. El porcentaje es respecto de los que entraron a la compra.
      </Titulo>

      {!r.ok ? (
        <p className="adm-alerta">
          {r.sinMigracion
            ? "Falta aplicar la migración 20261106000000_embudo_compra.sql en Supabase."
            : "No pude leer el embudo. Probá de nuevo en un rato."}
        </p>
      ) : !hayDatos ? (
        <SinDatos que="Todavía no hay visitas contadas." />
      ) : (
        <div className="adm-hoja overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Región</th>
                <th>Dispositivo</th>
                {PASOS_EMBUDO.map((p) => (
                  <th key={p}>{NOMBRE_PASO[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={`${l.region}-${l.dispositivo}`}>
                  <td>{l.region}</td>
                  <td>{NOMBRE_DISPOSITIVO[l.dispositivo]}</td>
                  {PASOS_EMBUDO.map((p) => (
                    <td key={p} className="whitespace-nowrap">
                      {l.cuentas[p]}
                      {p !== "entro" && l.porcentajes[p] !== null ? <span className="ml-1 text-xs text-[var(--texto-menor)]">{String(l.porcentajes[p]).replace(".", ",")} %</span> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Nota>
        Es un contador por día: no guarda cookies, IP, correo ni nada de la persona. Cada paso se cuenta una vez por pestaña.
        «Pagó» se cuenta cuando la pantalla de gracias confirma el pago. Por ahora mide solo la compra del libro de una vida.
      </Nota>
    </div>
  );
}
