// Qué se le dice a la familia cuando el audio original ya se borró (19/10).

import { describe, expect, it } from "vitest";
import { CANDADO_BORRADO, rutaCandado, textoAudioBorrado } from "../src/lib/audio-borrado";

describe("el aviso del audio borrado", () => {
  it("sin borrado no dice nada: el reproductor queda como estaba", () => {
    for (const v of [null, undefined, ""]) expect(textoAudioBorrado(v)).toBeNull();
  });

  it("con fecha, la cuenta en castellano y sin tecnicismos", () => {
    expect(textoAudioBorrado("2027-01-12T09:30:00.000Z")).toBe(
      "Este audio se borró el 12 de enero de 2027. Sus frases en «Su voz» siguen acá.",
    );
  });

  // Decirle a una familia una fecha inventada sería peor que no decir ninguna.
  it("con una fecha ilegible no inventa ninguna", () => {
    expect(textoAudioBorrado("cualquier cosa")).toBe("Este audio ya no está. Sus frases en «Su voz» siguen acá.");
  });

  // Lo que más importa del mensaje: que no crean que perdieron su voz.
  it("siempre aclara que «Su voz» sigue", () => {
    for (const v of ["2027-01-12T09:30:00.000Z", "roto"]) expect(textoAudioBorrado(v)).toContain("Su voz");
  });

  it("la ruta del candado es la que escribe la fábrica", () => {
    expect(CANDADO_BORRADO).toBe("audios_borrados.txt");
    expect(rutaCandado("n1")).toBe("n1/paquete/audios_borrados.txt");
  });
});
