export default function Privacidad() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">Privacidad</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Lo mínimo que necesitas saber sobre qué hacemos con los datos de tu familia.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="text-base font-medium text-zinc-900">Qué guardamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Tus datos de contacto (nombre, email, WhatsApp) y, con el consentimiento explícito
              del narrador dado por WhatsApp antes de empezar, los audios que graba día a día y
              las transcripciones que hacemos de ellos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Para qué los usamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Únicamente para armar el libro y el audiolibro que pediste. No los usamos para
              nada más — ni publicidad, ni entrenamiento de otros productos, ni ningún otro fin.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Dónde los guardamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              En Supabase, con servidores en la Unión Europea. El acceso está restringido a lo
              necesario para generar tu libro.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Tus derechos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Puedes pedir acceder a tus datos, corregirlos o borrarlos por completo cuando
              quieras. Alcanza con escribir a{" "}
              <a
                href="mailto:contacto@vitacorafamiliar.com"
                className="underline decoration-zinc-300 underline-offset-2"
              >
                contacto@vitacorafamiliar.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-zinc-900">Lo que jamás hacemos</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Nunca vendemos ni compartimos tus datos ni los de tu familia con terceros.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
