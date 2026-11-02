"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import {
  BUCKET_CONTENIDO,
  delDia,
  ESTADOS,
  errorDeArchivo,
  grillaDelMes,
  mover,
  REDES,
  type EstadoContenido,
  type Mes,
  type PiezaContenido,
} from "@/lib/admin/contenido";
import { borrarContenido, confirmarSubida, editarContenido, guardarOrden, pedirSubida } from "./acciones";

// La carpeta y el calendario de la pantalla Contenido. Se arrastra una pieza de la carpeta
// a un día, de un día a otro, o de vuelta a la carpeta; soltarla encima de otra la pone
// antes de esa. El cambio se ve en el acto y se guarda atrás (si falla, vuelve a como
// estaba y dice por qué). Tocar una pieza abre su ficha: ahí también se cambia el día,
// que es el camino en el teléfono, donde arrastrar no anda.

const DIAS_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

const COLOR_ESTADO: Record<EstadoContenido, string> = {
  borrador: "border-[var(--linea-fuerte)]",
  listo: "border-[#B07A18]",
  publicado: "border-[var(--acento)]",
};

const campo = "rounded border border-[var(--linea)] bg-[var(--fondo)] px-2 py-1 text-sm";

function Vista({ pieza, chica = false }: { pieza: PiezaContenido; chica?: boolean }) {
  const caja = chica ? "h-10 w-10" : "h-full w-full";
  if (pieza.url && pieza.tipo.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage: no pasa por next/image
    return <img src={pieza.url} alt="" className={`${caja} rounded object-cover`} draggable={false} />;
  }
  if (pieza.url && pieza.tipo.startsWith("video/")) {
    return <video src={pieza.url} muted preload="metadata" className={`${caja} rounded object-cover`} />;
  }
  const marca = pieza.tipo.startsWith("audio/") ? "audio" : pieza.tipo === "application/pdf" ? "pdf" : "archivo";
  return (
    <span className={`${caja} flex items-center justify-center rounded bg-[var(--hueco)] text-xs text-[var(--texto-menor)]`}>
      {marca}
    </span>
  );
}

export function Calendario({ inicial, mes, hoy }: { inicial: PiezaContenido[]; mes: Mes; hoy: string }) {
  const router = useRouter();
  const [piezas, setPiezas] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [encima, setEncima] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [, empezar] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);

  // Lo que viene del servidor manda (después de cada guardado, revalidatePath lo trae de nuevo).
  useEffect(() => setPiezas(inicial), [inicial]);

  const soltarEn = (fecha: string | null, antesDe: string | null) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEncima(null);
    if (e.dataTransfer.files.length > 0) {
      void subir(Array.from(e.dataTransfer.files));
      return;
    }
    const id = e.dataTransfer.getData("text/plain");
    if (!id || id === antesDe) return;
    const grupo = delDia(piezas.filter((p) => p.id !== id), fecha);
    const indice = antesDe ? grupo.findIndex((p) => p.id === antesDe) : grupo.length;
    const { piezas: nuevas, cambios } = mover(piezas, id, fecha, indice < 0 ? grupo.length : indice);
    if (cambios.length === 0) return;
    const antes = piezas;
    setPiezas(nuevas);
    setError(null);
    empezar(async () => {
      const r = await guardarOrden(cambios);
      if (r.error) {
        setPiezas(antes);
        setError(r.error);
      }
    });
  };

  const sobre = (clave: string) => (e: DragEvent) => {
    e.preventDefault();
    if (encima !== clave) setEncima(clave);
  };

  async function subir(archivos: File[]) {
    setError(null);
    const navegador = crearClienteNavegador();
    for (const [i, archivo] of archivos.entries()) {
      setSubiendo(`subiendo ${i + 1} de ${archivos.length}: ${archivo.name}`);
      const motivo = errorDeArchivo(archivo.type, archivo.size);
      if (motivo) {
        setError(`${archivo.name}: ${motivo}`);
        continue;
      }
      const permiso = await pedirSubida({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
      if (permiso.error !== null) {
        setError(`${archivo.name}: ${permiso.error}`);
        continue;
      }
      const { error: errorSubida } = await navegador.storage
        .from(BUCKET_CONTENIDO)
        .uploadToSignedUrl(permiso.path, permiso.token, archivo, { contentType: archivo.type });
      if (errorSubida) {
        console.error("contenido: falló la subida directa", errorSubida);
        setError(`${archivo.name}: no se pudo subir. Probá de nuevo.`);
        continue;
      }
      const listo = await confirmarSubida({ id: permiso.id, nombre: archivo.name, tipo: archivo.type });
      if (listo.error) setError(`${archivo.name}: ${listo.error}`);
    }
    setSubiendo(null);
    router.refresh();
  }

  const tarjeta = (p: PiezaContenido, enDia: boolean) => (
    <div
      key={p.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={sobre(`pieza-${p.id}`)}
      onDrop={soltarEn(p.fecha, p.id)}
      onClick={() => setAbierta(p.id)}
      title={p.titulo ?? p.nombre}
      className={`flex cursor-grab items-center gap-2 rounded border-l-4 bg-[var(--relieve)] p-1 text-left text-xs active:cursor-grabbing ${
        COLOR_ESTADO[p.estado] ?? COLOR_ESTADO.borrador
      } ${encima === `pieza-${p.id}` ? "ring-2 ring-[var(--acento)]" : ""} ${enDia ? "" : "w-full"}`}
    >
      <Vista pieza={p} chica />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{p.titulo || p.nombre}</span>
        <span className="block truncate text-[var(--texto-menor)]">
          {[p.hora, p.red].filter(Boolean).join(" · ") || p.estado}
        </span>
      </span>
    </div>
  );

  const carpeta = delDia(piezas, null);
  const pieza = piezas.find((p) => p.id === abierta) ?? null;

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside
        onDragOver={sobre("carpeta")}
        onDragLeave={() => setEncima(null)}
        onDrop={soltarEn(null, null)}
        className={`rounded-lg border border-dashed p-3 ${encima === "carpeta" ? "border-[var(--acento)] bg-[var(--hueco)]" : "border-[var(--linea-fuerte)]"}`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            Carpeta <span className="text-[var(--texto)]">{carpeta.length}</span>
          </h2>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={subiendo !== null}
            className="rounded bg-[var(--acento)] px-2 py-1 text-xs text-[var(--sobre-acento)] disabled:opacity-60"
          >
            subir archivos
          </button>
          <input
            ref={entrada}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const archivos = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (archivos.length > 0) void subir(archivos);
            }}
          />
        </div>
        {subiendo ? <p className="mb-2 text-xs text-[var(--texto-suave)]">{subiendo}…</p> : null}
        {carpeta.length === 0 ? (
          <p className="text-xs leading-relaxed text-[var(--texto-menor)]">
            Soltá acá fotos, videos o audios (o tocá «subir archivos»). Después arrastralos a un día del calendario.
          </p>
        ) : (
          <div className="flex max-h-[70vh] flex-col gap-1.5 overflow-y-auto">{carpeta.map((p) => tarjeta(p, false))}</div>
        )}
      </aside>

      <div className="min-w-0">
        {error ? (
          <p className="mb-3 rounded border border-[var(--alerta)] px-3 py-2 text-sm text-[var(--alerta)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 gap-px rounded-lg border border-[var(--linea)] bg-[var(--linea)]">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="bg-[var(--fondo)] px-2 py-1 text-xs uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                {d}
              </div>
            ))}
            {grillaDelMes(mes).flat().map(({ dia, delMes }) => (
              <div
                key={dia}
                onDragOver={sobre(dia)}
                onDragLeave={() => setEncima(null)}
                onDrop={soltarEn(dia, null)}
                className={`flex min-h-[110px] flex-col gap-1 p-1.5 ${
                  encima === dia ? "bg-[var(--hueco)]" : "bg-[var(--fondo)]"
                } ${delMes ? "" : "opacity-50"}`}
              >
                <span
                  className={`self-end text-xs ${
                    dia === hoy ? "rounded-full bg-[var(--acento)] px-1.5 text-[var(--sobre-acento)]" : "text-[var(--texto-menor)]"
                  }`}
                >
                  {Number(dia.slice(8))}
                </span>
                {delDia(piezas, dia).map((p) => tarjeta(p, true))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--texto-menor)]">
          <span className="border-l-4 border-[var(--linea-fuerte)] pl-2">borrador</span>
          <span className="border-l-4 border-[#B07A18] pl-2">listo para publicar</span>
          <span className="border-l-4 border-[var(--acento)] pl-2">publicado</span>
        </p>
      </div>

      {pieza ? (
        <Ficha
          key={pieza.id}
          pieza={pieza}
          cerrar={() => setAbierta(null)}
          alGuardar={() => {
            setAbierta(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function Ficha({ pieza, cerrar, alGuardar }: { pieza: PiezaContenido; cerrar: () => void; alGuardar: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={cerrar}>
      <div
        role="dialog"
        aria-label={pieza.titulo || pieza.nombre}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-lg bg-[var(--fondo)] p-5 text-[var(--texto)] shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-[var(--texto-menor)]">{pieza.nombre}</p>
          <button type="button" onClick={cerrar} className="text-sm text-[var(--texto-suave)]">
            cerrar
          </button>
        </div>
        <div className="mb-4 flex max-h-[280px] justify-center overflow-hidden rounded bg-[var(--hueco)]">
          {pieza.url && pieza.tipo.startsWith("video/") ? (
            <video src={pieza.url} controls className="max-h-[280px]" />
          ) : pieza.url && pieza.tipo.startsWith("audio/") ? (
            <audio src={pieza.url} controls className="m-6 w-full" />
          ) : (
            <span className="h-[280px] w-full">
              <Vista pieza={pieza} />
            </span>
          )}
        </div>
        {pieza.url ? (
          <a href={pieza.url} target="_blank" rel="noreferrer" className="mb-4 inline-block text-xs text-[var(--texto-suave)] underline">
            abrir el archivo
          </a>
        ) : null}

        <form
          action={(datos) =>
            empezar(async () => {
              const r = await editarContenido(datos);
              if (r.error) setError(r.error);
              else alGuardar();
            })
          }
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={pieza.id} />
          <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
            Título
            <input className={campo} name="titulo" defaultValue={pieza.titulo ?? ""} maxLength={120} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
            Texto de la publicación
            <textarea className={`${campo} min-h-[110px]`} name="texto" defaultValue={pieza.texto ?? ""} maxLength={5000} />
          </label>
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
              Día
              <input className={campo} type="date" name="fecha" defaultValue={pieza.fecha ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
              Hora
              <input className={campo} type="time" name="hora" defaultValue={pieza.hora ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
              Red
              <select className={campo} name="red" defaultValue={pieza.red ?? ""}>
                <option value="">—</option>
                {REDES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
              Estado
              <select className={campo} name="estado" defaultValue={pieza.estado}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-[var(--texto-menor)]">Sin día, vuelve a la carpeta.</p>

          {error ? (
            <p className="text-sm text-[var(--alerta)]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                if (!window.confirm(`¿Sacar «${pieza.titulo || pieza.nombre}»? Se borra también el archivo.`)) return;
                empezar(async () => {
                  const r = await borrarContenido(pieza.id);
                  if (r.error) setError(r.error);
                  else alGuardar();
                });
              }}
              className="text-sm text-[var(--alerta)] disabled:opacity-60"
            >
              sacar
            </button>
            <button
              type="submit"
              disabled={pendiente}
              className="rounded bg-[var(--acento)] px-3 py-1.5 text-sm text-[var(--sobre-acento)] disabled:opacity-60"
            >
              {pendiente ? "guardando…" : "guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
