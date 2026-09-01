import Link from "next/link";

const PASOS = [
  {
    numero: "1",
    titulo: "Lo registrás",
    texto:
      "Nos cuentas quién es él, cómo le dicen y a qué hora del día prefiere que lo llamemos.",
  },
  {
    numero: "2",
    titulo: "Él cuenta su vida",
    texto:
      "Cada mañana le llega una pregunta por WhatsApp. Responde con un audio, como si se lo contara a un amigo.",
  },
  {
    numero: "3",
    titulo: "Recibís su libro y su voz",
    texto:
      "A los 30 días, la familia recibe un libro en PDF y un audiolibro narrado con su propia voz.",
  },
] as const;

export default function Home() {
  const precio = process.env.PRECIO_EUR || "49";

  return (
    <div className="flex flex-1 flex-col bg-white text-zinc-900">
      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight">
            En 30 días, el libro de la vida de tu papá. Contado con su propia
            voz.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600">
            Cada mañana le hacemos una pregunta por WhatsApp. Él responde con
            un audio, como le cuenta las cosas a un amigo. Nosotros lo
            convertimos en un libro y un audiolibro que quedan para siempre.
          </p>
          <Link
            href="/entrar"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Regalale su bitácora
          </Link>
        </section>

        {/* 3 pasos */}
        <section className="border-t border-zinc-100 bg-zinc-50 py-20">
          <div className="mx-auto grid w-full max-w-4xl gap-10 px-6 sm:grid-cols-3">
            {PASOS.map((paso) => (
              <div key={paso.numero} className="flex flex-col gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {paso.numero}
                </span>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {paso.titulo}
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  {paso.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Saludos de la familia */}
        <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
            Los saludos de la familia
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
            Antes de entregarle el libro, cada uno de sus seres queridos puede
            grabarle un saludo. Esos audios se suman al audiolibro, así él
            también escucha lo que ustedes tienen para decirle.
          </p>
        </section>

        {/* Precio */}
        <section className="border-t border-zinc-100 bg-zinc-50 py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Precio único
            </p>
            <p className="text-4xl font-semibold text-zinc-900">
              {precio}&nbsp;€
            </p>
            <p className="max-w-md text-sm leading-relaxed text-zinc-600">
              Incluye las preguntas diarias durante 30 días, el libro en PDF,
              el audiolibro con su voz y los saludos grabados de la familia.
            </p>
            <Link
              href="/entrar"
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Regalale su bitácora
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-6 text-center text-sm text-zinc-500">
          <Link href="/legal/privacidad" className="hover:text-zinc-700">
            Política de privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}
