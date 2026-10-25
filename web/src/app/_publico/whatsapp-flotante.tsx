import { TEXTOS_PUBLICO } from "../_textos/publico";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import type { IdiomaWeb } from "@/lib/idioma-web";

// El botón redondo de WhatsApp, abajo a la derecha (maqueta Resto): las dudas
// las contesta una persona de Vitácora. Sin NEXT_PUBLIC_WHATSAPP_DUDAS no se
// pinta (PASO-DE-MANOS C17). En el teléfono sube por encima de la barra de
// compra fija.

export function WhatsAppFlotante({ idioma }: { idioma: IdiomaWeb }) {
  const url = urlWhatsAppDudas();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={TEXTOS_PUBLICO[idioma].escribirWhatsApp}
      className="wa-flotante m-btn fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_rgba(0,0,0,0.45)] lg:bottom-6 lg:right-6"
    >
      <IconoWhatsApp className="h-7 w-7" />
    </a>
  );
}

export function IconoWhatsApp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}
