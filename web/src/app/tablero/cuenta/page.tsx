import { redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiasDelUsuario } from "@/lib/panel";
import { Contenedor, EstadoError, Etiqueta, Tarjeta, Titulo } from "../ui";

// Tu cuenta: lo poco que hay que saber y poder hacer. El tema se cambia con
// el botón de arriba a la derecha; los datos de compra no se editan acá.

export default async function PaginaCuenta() {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { panel, error } = await historiasDelUsuario(admin, user);
  if (error) return <EstadoError />;

  const propias = panel.historias.filter((h) => h.rol === "duena").length;
  const compartidas = panel.historias.length - propias;

  return (
    <Contenedor>
      <Etiqueta>Configuración</Etiqueta>
      <div className="mt-1">
        <Titulo>Tu cuenta</Titulo>
      </div>

      <Tarjeta className="mt-8">
        <dl className="flex flex-col gap-4 text-[15px]">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-[var(--texto-menor)]">Correo</dt>
            <dd className="[font-family:var(--fuente-micro)]">{user.email}</dd>
          </div>
          {panel.familia ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-[var(--texto-menor)]">Región</dt>
              <dd className="[font-family:var(--fuente-micro)]">{panel.familia.region === "ES" ? "España" : "Argentina"}</dd>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-[var(--texto-menor)]">Historias</dt>
            <dd className="[font-family:var(--fuente-micro)]">
              {propias} {propias === 1 ? "propia" : "propias"}{compartidas > 0 ? ` · ${compartidas} ${compartidas === 1 ? "compartida" : "compartidas"}` : ""}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      <p className="mt-6 text-[14px] leading-relaxed text-[var(--texto-menor)]">
        Para cambiar el correo o borrar la cuenta, escribinos a{" "}
        <a href="mailto:hola@vitacorafamiliar.com" className="underline decoration-[var(--linea-fuerte)] underline-offset-4">hola@vitacorafamiliar.com</a>.
        Los audios y las fotos son de tu familia: se borran todos cuando lo pidas.
      </p>

      <div className="mt-10">
        <a
          href="/api/auth/salir"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--linea-fuerte)] px-6 text-[15px] font-medium transition-colors hover:bg-[var(--hueco)] [font-family:var(--fuente-micro)]"
        >
          Cerrar sesión
        </a>
      </div>
    </Contenedor>
  );
}
