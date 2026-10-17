# Fuentes del libro impreso

TrueType estáticas de Playfair Display, Source Serif 4 y Archivo, instanciadas con fontTools
(`fontTools.varLib.instancer`) a cada peso desde las variables de https://github.com/google/fonts.
Licencia: SIL Open Font License 1.1 (https://openfontlicense.org), la misma de Google Fonts.

Por qué estáticas: Chromium imprime las fuentes variables como Type 3 y la imprenta necesita fuentes
de verdad incrustadas. Las usa `src/libro/bookmundo/fuentes.ts` (17/10/2026, libro de Imma).
