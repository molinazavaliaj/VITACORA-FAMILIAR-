// Corre una vez al arrancar cada instancia del servidor (Next, instrumentation).
// La alarma de variables (lib/variables.ts) va sin await: nunca demora ni frena el arranque.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { avisarVariablesAlArrancar } = await import("./lib/variables");
  void avisarVariablesAlArrancar();
}
