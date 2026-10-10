// Los libros del escritor nuevo corren en segundo plano: un libro tarda de 4 a 9 horas por Batch y el tick
// del worker (cada minuto) no puede esperarlo. La cola lleva los trabajos en marcha, uno por narrador
// (la Etapa A y el libro de un mismo narrador nunca corren a la vez), con un máximo de trabajos juntos.
// Vive en la memoria del proceso: si Railway reinicia, se pierde, y el próximo tick relanza lo que faltaba;
// el trabajo retoma de los checkpoints del almacén (lo ya pagado no se vuelve a pagar).

export class Cola {
  private readonly enMarcha = new Map<string, Promise<void>>();

  constructor(private readonly maximo: () => number, private readonly log: (s: string) => void = (s) => console.error(s)) {}

  ocupada(clave: string): boolean {
    return this.enMarcha.has(clave);
  }

  get cuantos(): number {
    return this.enMarcha.size;
  }

  /** ¿Se puede lanzar un trabajo con esta clave ahora mismo? */
  hayLugar(clave: string): boolean {
    return !this.enMarcha.has(clave) && this.enMarcha.size < Math.max(1, this.maximo());
  }

  /**
   * Lanza el trabajo sin esperarlo. Devuelve false si esa clave ya está en marcha o la cola está llena.
   * Lo que el trabajo tire se loguea acá: un trabajo en segundo plano nunca puede tumbar el proceso.
   */
  lanzar(clave: string, trabajo: () => Promise<void>): boolean {
    if (!this.hayLugar(clave)) return false;
    const p = (async () => {
      try {
        await trabajo();
      } catch (err) {
        this.log(`escritor: el trabajo ${clave} se cortó: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        this.enMarcha.delete(clave);
      }
    })();
    this.enMarcha.set(clave, p);
    return true;
  }

  /** Para los tests (y un apagado ordenado): espera a que termine todo lo que está en marcha. */
  async esperarTodo(): Promise<void> {
    while (this.enMarcha.size) await Promise.all([...this.enMarcha.values()]);
  }
}
