import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { aEuros, cambioDeEntorno } from "@/lib/admin/plata";
import { Cifra, euros, fechaCorta, Nota, SinDatos, Titulo } from "../ui";
import { FormularioGasto } from "./formulario";

// 07 · Gastos — «qué se gastó, día por día y paso por paso».
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
    <div className="adm-entra">
      <Titulo ruta="/admin/gastos">
        Todo lo que gasta la estructura, sin las herramientas de trabajo de ustedes: acá está lo que se cobra solo
        (cada llamada al modelo) y lo que se carga a mano (Railway, el dominio, la imprenta).
      </Titulo>

      {sinConvertir ? (
        <p className="adm-alerta mb-5">
          Falta el tipo de cambio: los números en dólares se muestran crudos y no se suman a la cuenta en euros.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Cifra
          etiqueta="Inteligencia artificial del mes"
          valor={totalConsumo === null ? `USD ${totalConsumoUsd.toFixed(2)}` : euros(totalConsumo)}
          detalle={`${datos.consumo.length} llamadas anotadas`}
        />
        <Cifra etiqueta="Cargado a mano" valor={euros(totalManual)} detalle={`${datos.gastos.length} gastos fijos`} />
        <Cifra
          etiqueta="De cada paso del trabajo"
          valor={pasos.length}
          detalle={pasos.length > 0 ? `el más caro: ${pasos[0][0].replace(/_/g, " ")}` : "todavía sin llamadas"}
        />
      </div>

      <h2 className="adm-micro mt-12">
        Día por día
      </h2>
      {dias.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay gasto de inteligencia artificial anotado: se anota solo con la primera llamada del mes." />
        </div>
      ) : (
        <div className="adm-hoja mt-4 flex flex-col gap-2 px-5 py-4">
          {dias.map(([dia, v]) => {
            const e = enEuros(v.usd);
            // El día más caro llena la barra: el resto se lee contra ese.
            const maximo = Math.max(...dias.map(([, d]) => d.usd)) || 1;
            return (
              <div key={dia} className="grid grid-cols-[52px_1fr_auto] items-center gap-4 text-sm sm:grid-cols-[64px_1fr_140px]">
                <span className="adm-dato text-[var(--texto-menor)]">{fechaCorta(dia)}</span>
                <span className="adm-barra">
                  <i style={{ width: `${Math.max(2, (v.usd / maximo) * 100)}%` }} />
                </span>
                <span className="adm-dato text-right">
                  {e === null ? `USD ${v.usd.toFixed(2)}` : euros(e)}
                  <span className="ml-2 text-xs text-[var(--texto-menor)]">{v.veces}×</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="adm-micro mt-12">
        Paso por paso
      </h2>
      {pasos.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay llamadas al modelo en el mes." />
        </div>
      ) : (
        <div className="adm-hoja mt-3 overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Paso</th>
                <th>Quién lo hace</th>
                <th>Modelo</th>
                <th>Veces</th>
                <th>Costó</th>
              </tr>
            </thead>
            <tbody>
              {pasos.map(([paso, v]) => {
                const e = enEuros(v.usd);
                return (
                  <tr key={paso}>
                    <td>{paso.replace(/_/g, " ")}</td>
                    <td>{v.servicio}</td>
                    <td>{v.modelo}</td>
                    <td>{v.veces}</td>
                    <td>{e === null ? `USD ${v.usd.toFixed(2)}` : euros(e)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="adm-micro mt-12">
        Cargado a mano
      </h2>
      <div className="adm-hoja mt-4 p-5">
        <FormularioGasto />
      </div>
      {datos.gastos.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay ningún gasto fijo cargado este mes (Railway, el dominio, los mails)." />
        </div>
      ) : (
        <div className="adm-hoja mt-3 overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Qué</th>
                <th>Categoría</th>
                <th>De quién</th>
                <th>Monto</th>
                <th>En euros</th>
              </tr>
            </thead>
            <tbody>
              {datos.gastos.map((g, i) => {
                const e = aEuros(g.monto, g.moneda, cambio);
                return (
                  <tr key={`${g.concepto}-${i}`}>
                    <td>{fechaCorta(g.fecha)}</td>
                    <td>{g.concepto}</td>
                    <td>{g.categoria}</td>
                    <td>{g.quien ?? "—"}</td>
                    <td>
                      {g.monto} {g.moneda}
                    </td>
                    <td>{e === null ? "—" : euros(e)}</td>
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
