"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

// El formulario de Stripe dentro de /pagar. Corre en un iframe de Stripe: los
// datos de la tarjeta nunca pasan por nuestra página. Al cobrar, Stripe lleva la
// página entera a la `return_url` (/api/pago/vuelta), como el pago de siempre.
export function FormularioPago({ clavePublica, secretoSesion, noCarga }: { clavePublica: string; secretoSesion: string; noCarga: string }) {
  const [error, setError] = useState(false);
  // Una sola vez por página: Stripe no deja cambiarlo después de montar.
  const [stripe] = useState(() =>
    loadStripe(clavePublica).catch((err: unknown) => {
      console.error("pagar: no cargó Stripe.js", err);
      setError(true);
      return null;
    }),
  );

  if (error) return <p role="alert" className="chk-bajada">{noCarga}</p>;

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret: secretoSesion }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
