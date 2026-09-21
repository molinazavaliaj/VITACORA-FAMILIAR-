import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { aEuros, cambioDeEntorno } from "@/lib/admin/plata";
import { euros, fechaCorta, Nota, SinDatos, Tarjeta, Titulo } from "../ui";

// 04 · Gastos — «qué se gastó, día por día y paso por paso».
// Dos cosas distintas en la misma pantalla: lo que se cobra solo (cada llamada al modelo,
// anotada por los tres servicios) y lo que se carga a mano (Railway, el dominio, la imprenta).

export default async function PantallaGastos() {
  const ahora = new Date();
  const datos = await datosDelPanel(crearClienteServidor(), ahora);
  const cambio = cambioDeEntorno(process.env);

  const enEuros = (usd: number) => aEuros(usd, "USD", cambio);

  const porDia = new Map<string, { usd: number; veces: number }>();
  const porPaso = new Map<string, { usd: number; veces: number; modelo: string; servicio: string }>();
  for (const c of datos.consumo) {
    const dia = c.fecha.slice(0, 10);
    const d = porDia.get(dia) ?? { usd: 0, veces: 0 };
    porDia.set(dia, { usd: d.usd + (c.usd ?? 0), veces: d.veces + 1 });

    const p = porPaso.get(c.paso) ?? { usd: 0, veces: 0, modelo: c.modelo, servicio: c.servicio };
    porPaso.set(c.paso, { usd: p.usd + (c.usd ?? 0), veces: p.veces + 1, modelo: c.modelo, servicio: c.servicio });
  }

  const dias = [...porDia.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const pasos = [...porPaso.entries()].sort((a, b) => b[1].usd - a[1].usd);
  const totalConsumoUsd = dias.reduce((s, [, v]) => s + v.usd, 0);
  const totalConsumo = enEuros(totalConsumoUsd);
  const totalManual = datos.gastos.reduce((s, g) => s + (aEuros(g.monto, g.moneda, cambio) ?? 0), 0);
  const sinConvertir = totalConsumo === null || datos.gastos.some((g) => aEuros(g.monto, g.moneda, cambio) === null);

  return (
    <div>
      <Titulo numero="04" nombre="Gastos" aclara="qué se gastó, día por día y paso por paso" />

      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--texto-suave)]">
        Todo lo que gasta la estructura, sin las herramientas de trabajo de ustedes: acá está lo que se cobra solo
        (cada llamada al modelo) y lo que se carga a mano (Railway, el dominio, la imprenta).
      </p>

      {sinConvertir ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">
          Falta el tipo de cambio: los números en dólares se muestran crudos y no se suman a la cuenta en euros.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            Inteligencia artificial del mes
          </p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">
            {totalConsumo === null ? `USD ${totalConsumoUsd.toFixed(2)}` : euros(totalConsumo)}
          </p>
          <span className="text-xs text-[var(--texto-menor)]">{datos.consumo.length} llamadas anotadas</span>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            Cargado a mano
          </p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">{euros(totalManual)}</p>
          <span className="text-xs text-[var(--texto-menor)]">{datos.gastos.length} gastos fijos</span>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            De cada paso del trabajo
          </p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">{pasos.length}</p>
          <span className="text-xs text-[var(--texto-menor)]">
            {pasos.length > 0 ? `el más caro: ${pasos[0][0]}` : "todavía sin llamadas"}
          </span>
        </Tarjeta>
      </div>

      <h2 className="mt-8 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        Día por día
      </h2>
      {dias.length === 0 ? (
        <div className="mt-3">
          <SinDatos que="Todavía no hay gasto de inteligencia artificial anotado: se anota solo con la primera llamada del mes." />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {dias.map(([dia, v]) => {
            const e = enEuros(v.usd);
            const maximo = dias[0][1].usd || 1;
            return (
              <div key={dia} className="grid grid-cols-[90px_1fr_110px] items-center gap-3 text-sm">
                <span className="text-[var(--texto-menor)]">{fechaCorta(dia)}</span>
                <span className="h-2 rounded-full bg-[var(--hueco)]">
                  <span
                    className="block h-2 rounded-full bg-[var(--acento)]"
                    style={{ width: `${Math.max(2, (v.usd / maximo) * 100)}%` }}
                  />
                </span>
                <span className="text-right">
                  {e === null ? `USD ${v.usd.toFixed(2)}` : euros(e)}
                  <span className="ml-2 text-xs text-[var(--texto-menor)]">{v.veces}×</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        Paso por paso
      </h2>
      {pasos.length === 0 ? (
        <div className="mt-3">
          <SinDatos que="Todavía no hay llamadas al modelo en el mes." />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <th className="border-b border-[var(--linea)] py-2 pr-4">Paso</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Quién lo hace</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Modelo</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Veces</th>
                <th className="border-b border-[var(--linea)] py-2">Costó</th>
              </tr>
            </thead>
            <tbody>
              {pasos.map(([paso, v]) => {
                const e = enEuros(v.usd);
                return (
                  <tr key={paso}>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{paso.replace(/_/g, " ")}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{v.servicio}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{v.modelo}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{v.veces}</td>
                    <td className="border-b border-[var(--linea)] py-2">{e === null ? `USD ${v.usd.toFixed(2)}` : euros(e)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        Cargado a mano
      </h2>
      {datos.gastos.length === 0 ? (
        <div className="mt-3">
          <SinDatos que="Todavía no hay ningún gasto fijo cargado este mes (Railway, el dominio, los mails)." />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <th className="border-b border-[var(--linea)] py-2 pr-4">Fecha</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Qué</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Categoría</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">De quién</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Monto</th>
                <th className="border-b border-[var(--linea)] py-2">En euros</th>
              </tr>
            </thead>
            <tbody>
              {datos.gastos.map((g, i) => {
                const e = aEuros(g.monto, g.moneda, cambio);
                return (
                  <tr key={`${g.concepto}-${i}`}>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{fechaCorta(g.fecha)}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{g.concepto}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{g.categoria}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">{g.quien ?? "—"}</td>
                    <td className="border-b border-[var(--linea)] py-2 pr-4">
                      {g.monto} {g.moneda}
                    </td>
                    <td className="border-b border-[var(--linea)] py-2">{e === null ? "—" : euros(e)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Nota>
        El gasto de inteligencia artificial no se carga a mano: cada servicio anota la llamada al modelo cuando la
        hace (con sus tokens y su precio), así que estas cifras son las mismas que después se usan para saber cuánto
        costó cada libro. Las herramientas de trabajo de ustedes (Claude Code, Hermes) no entran acá.
      </Nota>
    </div>
  );
}
