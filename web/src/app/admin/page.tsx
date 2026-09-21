import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { contarPorGravedad, frenosDe, horasEntre, UMBRALES, type Freno } from "@/lib/admin/frenos";
import { Chip, Grupo, Item, SinDatos, Titulo, cuando, horasEnPalabras } from "./ui";

// 01 · Estado — «qué se frenó y qué hay que hacer hoy». Es la pantalla de entrada: lo que
// no se puede dejar pasar, y abajo lo que va solo (para no mirar todo con la misma alarma).

export default async function PantallaEstado() {
  const ahora = new Date();
  const datos = await datosDelPanel(crearClienteServidor(), ahora);
  const frenos = frenosDe(datos, ahora);
  const cuenta = contarPorGravedad(frenos);

  const deGravedad = (g: Freno["gravedad"]) => frenos.filter((f) => f.gravedad === g);

  // «Va solo» no sale de los frenos (que sólo tienen lo que anda mal): sale de mirar los
  // narradores al día y los libros entregados.
  const alDia = datos.narradores.filter((n) => {
    if (n.estado !== "activo") return false;
    const horas = horasEntre(n.ultima_respuesta_at, ahora);
    return horas !== null && horas <= UMBRALES.silencioDias * 24;
  });
  const terminados = datos.narradores.filter((n) => n.estado === "completado" || n.estado === "cerrado_anticipado");

  const linea = (f: Freno, i: number) => (
    <Item
      key={`${f.que}-${i}`}
      color={f.gravedad === "rojo" ? "rojo" : "ambar"}
      titulo={f.detalle}
      detalle={f.quien ? `Es de ${f.quien}.` : undefined}
      hace={f.horas === null ? undefined : horasEnPalabras(f.horas)}
    />
  );

  return (
    <div>
      <Titulo numero="01" nombre="Estado" aclara="qué se frenó y qué hay que hacer hoy" />

      {datos.narradores.length === 0 && datos.pedidos.length === 0 ? (
        <SinDatos que="Todavía no hay ninguna historia en curso: cuando entre el primer libro, acá aparece qué se frenó." />
      ) : null}

      <div className="mt-5">
        <Grupo color="rojo" titulo="Se frenó" cuenta={cuenta.rojo}>
          {deGravedad("rojo").length === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nada frenado. El carril está limpio.</p>
          ) : (
            deGravedad("rojo").map(linea)
          )}
        </Grupo>

        <Grupo color="ambar" titulo="Hay que estar atento" cuenta={cuenta.ambar}>
          {deGravedad("ambar").length === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nadie atrasado con lo suyo.</p>
          ) : (
            deGravedad("ambar").map(linea)
          )}
        </Grupo>

        <Grupo color="verde" titulo="Va solo" cuenta={alDia.length + terminados.length}>
          {alDia.length === 0 && terminados.length === 0 ? (
            <p className="text-sm text-[var(--texto-menor)]">Nadie respondió todavía en los últimos días.</p>
          ) : (
            <>
              {alDia.map((n) => (
                <Item
                  key={n.id}
                  color="verde"
                  titulo={`${n.nombre ?? "Sin nombre"}, al día.`}
                  detalle={`Va por el día ${n.dia_actual ?? 0} de 30 y contestó ${cuando(n.ultima_respuesta_at, ahora)}.`}
                  hace={cuando(n.ultima_respuesta_at, ahora)}
                />
              ))}
              {terminados.map((n) => (
                <Item
                  key={n.id}
                  color="verde"
                  titulo={`${n.nombre ?? "Sin nombre"}, terminado.`}
                  detalle={
                    n.libro_aprobado_at
                      ? `El libro se aprobó ${cuando(n.libro_aprobado_at, ahora)}.`
                      : "La entrevista cerró y el libro está en camino."
                  }
                  hace={cuando(n.libro_aprobado_at, ahora)}
                />
              ))}
            </>
          )}
        </Grupo>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--texto-menor)]">
        <span className="flex items-center gap-2">
          <Chip color="rojo">rojo</Chip> se pasó del tiempo: hay algo frenado
        </span>
        <span className="flex items-center gap-2">
          <Chip color="ambar">ámbar</Chip> quieto, y es normal
        </span>
        <span className="flex items-center gap-2">
          <Chip color="verde">verde</Chip> trabajó dentro del tiempo esperado
        </span>
      </div>
    </div>
  );
}
