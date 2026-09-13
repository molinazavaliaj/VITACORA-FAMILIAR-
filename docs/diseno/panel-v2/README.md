# Lienzo · Direcciones del panel (13/09)

Los artboards del lienzo **"Vitácora · Direcciones del panel"**:
https://claude.ai/code/artifact/3aa604ad-6d40-4ba4-ba8c-43ed3216f570

- `final.py` genera la dirección elegida (`Main`, `Historia_Editando`,
  `Historia_Oscura`, `Historias`, `Libro`, `Libro_Claro`, `Comprar`).
- `generar.py` genera los tres bocetos originales (A · B · C, `Precios`).
- `canvas.json` es la disposición: página 1 la elegida, página 2 los bocetos.

Regenerar: `python3 generar.py && python3 final.py`. El `.html` sembrado del
lienzo pesa 2 MB y no se commitea (`.gitignore`).

La decisión está escrita en `docs/panel-usuario.md` §15.
