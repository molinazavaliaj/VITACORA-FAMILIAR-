"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Region = "ES" | "AR";
type SiNo = "si" | "no" | "";

export default function FormularioRegistro() {
  const router = useRouter();

  // Quién regala
  const [nombreComprador, setNombreComprador] = useState("");
  const [vinculoComprador, setVinculoComprador] = useState("");
  const [region, setRegion] = useState<Region>("ES");

  // El narrador
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("");
  const [horaPreferida, setHoraPreferida] = useState("10:00");

  // Contexto
  const [lugarNacimiento, setLugarNacimiento] = useState("");
  const [anioNacimiento, setAnioNacimiento] = useState("");
  const [oficio, setOficio] = useState("");
  const [datosExtra, setDatosExtra] = useState("");

  // Árbol
  const [padres, setPadres] = useState("");
  const [hermanos, setHermanos] = useState("");
  const [tuvoPareja, setTuvoPareja] = useState<SiNo>("");
  const [conyuge, setConyuge] = useState("");
  const [tuvoHijos, setTuvoHijos] = useState<SiNo>("");
  const [hijos, setHijos] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const arbol: Record<string, string> = {};
    if (padres.trim()) arbol.padres = padres.trim();
    if (hermanos.trim()) arbol.hermanos = hermanos.trim();
    if (tuvoPareja === "no") arbol.conyuge = "no tuvo";
    else if (tuvoPareja === "si" && conyuge.trim()) arbol.conyuge = conyuge.trim();
    if (tuvoHijos === "no") arbol.hijos = "no tuvo";
    else if (tuvoHijos === "si" && hijos.trim()) arbol.hijos = hijos.trim();

    const contexto: Record<string, unknown> = {};
    if (lugarNacimiento.trim()) contexto.lugarNacimiento = lugarNacimiento.trim();
    if (anioNacimiento.trim()) contexto.anioNacimiento = Number(anioNacimiento);
    if (oficio.trim()) contexto.oficio = oficio.trim();
    if (datosExtra.trim()) contexto.datosExtra = datosExtra.trim();
    if (Object.keys(arbol).length > 0) contexto.arbol = arbol;

    const cuerpo = {
      nombreComprador,
      vinculoComprador,
      region,
      narrador: {
        nombre,
        comoLeDicen,
        telefonoWhatsapp,
        horaPreferida,
        contexto,
      },
    };

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error || "No pudimos completar el registro. Intenta de nuevo.");
        setEnviando(false);
        return;
      }

      router.push("/tablero");
    } catch {
      setError("No pudimos completar el registro. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">Registra al narrador</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Cuéntanos quién va a contar su historia. Con estos datos empezamos.
        </p>

        <form onSubmit={manejarEnvio} className="mt-8 flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Quién regala
            </h2>
            <Campo etiqueta="Tu nombre">
              <input
                type="text"
                required
                value={nombreComprador}
                onChange={(e) => setNombreComprador(e.target.value)}
                placeholder="Martina"
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Qué sos del narrador">
              <input
                type="text"
                required
                value={vinculoComprador}
                onChange={(e) => setVinculoComprador(e.target.value)}
                placeholder="hija, nieto, sobrina..."
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Región">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className={inputClase}
              >
                <option value="ES">España</option>
                <option value="AR">Argentina</option>
              </select>
            </Campo>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              El narrador
            </h2>
            <Campo etiqueta="Nombre">
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Roberto"
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="¿Cómo le decimos?">
              <input
                type="text"
                required
                value={comoLeDicen}
                onChange={(e) => setComoLeDicen(e.target.value)}
                placeholder="Don Roberto, Abuelo..."
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="WhatsApp">
              <input
                type="tel"
                required
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder={region === "AR" ? "11 5555 1234" : "612 345 678"}
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Hora preferida para escribirle">
              <input
                type="time"
                required
                value={horaPreferida}
                onChange={(e) => setHoraPreferida(e.target.value)}
                className={inputClase}
              />
            </Campo>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Un poco de contexto
            </h2>
            <p className="text-xs text-zinc-500">Todo esto es opcional.</p>
            <Campo etiqueta="Lugar de nacimiento">
              <input
                type="text"
                value={lugarNacimiento}
                onChange={(e) => setLugarNacimiento(e.target.value)}
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Año de nacimiento">
              <input
                type="number"
                min={1900}
                max={2015}
                value={anioNacimiento}
                onChange={(e) => setAnioNacimiento(e.target.value)}
                placeholder="1952"
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Oficio">
              <input
                type="text"
                value={oficio}
                onChange={(e) => setOficio(e.target.value)}
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Algo que ayude al biógrafo">
              <textarea
                value={datosExtra}
                onChange={(e) => setDatosExtra(e.target.value)}
                rows={3}
                className={inputClase}
              />
            </Campo>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Las personas de su vida
            </h2>
            <p className="text-xs text-zinc-500">
              Los nombres nos ayudan a que el biógrafo escuche bien. Opcional pero recomendado.
            </p>
            <Campo etiqueta="Nombres de sus padres">
              <input
                type="text"
                value={padres}
                onChange={(e) => setPadres(e.target.value)}
                className={inputClase}
              />
            </Campo>
            <Campo etiqueta="Nombres de sus hermanos">
              <input
                type="text"
                value={hermanos}
                onChange={(e) => setHermanos(e.target.value)}
                className={inputClase}
              />
            </Campo>

            <Campo etiqueta="¿Tuvo pareja de toda la vida?">
              <SelectorSiNo valor={tuvoPareja} onCambio={setTuvoPareja} />
            </Campo>
            {tuvoPareja === "si" && (
              <Campo etiqueta="Su nombre">
                <input
                  type="text"
                  value={conyuge}
                  onChange={(e) => setConyuge(e.target.value)}
                  className={inputClase}
                />
              </Campo>
            )}

            <Campo etiqueta="¿Tuvo hijos?">
              <SelectorSiNo valor={tuvoHijos} onCambio={setTuvoHijos} />
            </Campo>
            {tuvoHijos === "si" && (
              <Campo etiqueta="Sus nombres">
                <input
                  type="text"
                  value={hijos}
                  onChange={(e) => setHijos(e.target.value)}
                  className={inputClase}
                />
              </Campo>
            )}
          </section>

          <button
            type="submit"
            disabled={enviando}
            className="h-12 rounded-full bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {enviando ? "Registrando..." : "Registrar al narrador"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

const inputClase =
  "h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-zinc-900";

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

function SelectorSiNo({
  valor,
  onCambio,
}: {
  valor: SiNo;
  onCambio: (valor: SiNo) => void;
}) {
  return (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="radio"
          checked={valor === "si"}
          onChange={() => onCambio("si")}
        />
        Sí
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="radio"
          checked={valor === "no"}
          onChange={() => onCambio("no")}
        />
        No
      </label>
    </div>
  );
}
