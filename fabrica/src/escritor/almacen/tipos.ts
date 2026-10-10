// Dónde quedan los checkpoints del escritor (cada respuesta del modelo, los lotes, las carpetas por etapa,
// el libro, el informe y los costos). `leer` devuelve null si no existe; cualquier otro fallo tira.
export interface Almacen {
  leer(ruta: string): Promise<string | null>;
  escribir(ruta: string, texto: string): Promise<void>;
}
