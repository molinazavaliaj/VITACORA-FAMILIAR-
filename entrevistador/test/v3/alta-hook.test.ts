import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'v');

const h = vi.hoisted(() => ({ altaNuevo: vi.fn(async () => 'mandada' as const), preguntaDeOrden: vi.fn(async () => null) }));
vi.mock('../../src/db/cliente.js', () => ({ db: {} }));
vi.mock('../../src/db/guion.js', () => ({ preguntaDeOrden: h.preguntaDeOrden, capitulosDe: vi.fn(), tieneAdaptativas: vi.fn(async () => true), ultimoOrden: vi.fn(async () => 30) }));
vi.mock('../../src/whatsapp/enviar.js', () => ({ enviarPlantilla: vi.fn(), enviarTexto: vi.fn(), enviarImagenPorLink: vi.fn() }));
vi.mock('../../src/v3/pasar.js', () => ({ altaNuevo: h.altaNuevo }));
vi.mock('../../src/v3/deps-reales.js', () => ({ depsReales: () => ({ falsas: true }) }));

const { enviarPregunta } = await import('../../src/flujo/preguntar.js');
const N = { id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { genero: 'mujer' }, estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null, alerta_silencio: false };

beforeEach(() => { h.altaNuevo.mockClear(); h.preguntaDeOrden.mockClear(); });
afterEach(() => { vi.stubEnv('V3_PARA_NUEVOS', ''); });

describe('alta V3 de los nuevos en enviarPregunta', () => {
  it('apagado (por defecto): la pregunta 1 sigue por el flujo viejo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '');
    await enviarPregunta(N, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
    expect(h.preguntaDeOrden).toHaveBeenCalled();
  });

  it('cualquier valor que no sea "1" lo deja apagado', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', 'true');
    await enviarPregunta(N, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
    expect(h.preguntaDeOrden).toHaveBeenCalled();
  });

  it('prendido: la pregunta 1 de un acepto que recibió la bienvenida V3 la manda la V3 (con la ventana según la plantilla)', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    const nuevo = { ...N, contexto: { ...N.contexto, bienvenidaV3: true } };
    expect(await enviarPregunta(nuevo, 1, { plantilla: true })).toBe(true);
    expect(h.altaNuevo).toHaveBeenCalledWith({ falsas: true }, nuevo, { ventanaAbierta: false });
    expect(h.preguntaDeOrden).not.toHaveBeenCalled();
  });

  it('prendido, pero quien recibió la bienvenida vieja (antes de prender) sigue por el flujo viejo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    await enviarPregunta(N, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
    expect(h.preguntaDeOrden).toHaveBeenCalled();
  });

  it('prendido, pero un viaje sigue por su flujo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    await enviarPregunta({ ...N, contexto: { modo: 'viaje', genero: 'mujer' } }, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
  });

  it('apagado, pero un regalo va siempre por la V3', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '');
    const regalo = { ...N, contexto: { genero: 'mujer', regalo: true, idioma: 'ca' } };
    expect(await enviarPregunta(regalo, 1, { plantilla: false })).toBe(true);
    expect(h.altaNuevo).toHaveBeenCalledWith({ falsas: true }, regalo, { ventanaAbierta: true });
    expect(h.preguntaDeOrden).not.toHaveBeenCalled();
  });

  it('un regalo con el alta frenada (sin género) no recibe la pregunta vieja', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '');
    h.altaNuevo.mockResolvedValueOnce('frenada' as never);
    const regalo = { ...N, contexto: { regalo: true, idioma: 'ca' } };
    expect(await enviarPregunta(regalo, 1, { plantilla: false })).toBe(false);
    expect(h.altaNuevo).toHaveBeenCalled();
    expect(h.preguntaDeOrden).not.toHaveBeenCalled();
  });

  // Robustez (10/10): el mail «dijo que sí» de un regalo sale solo si OR1 salió de verdad.
  it('un regalo cuya OR1 quedó en la cola (Meta la rechazó o falta la plantilla) devuelve false', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '');
    h.altaNuevo.mockResolvedValueOnce('en-cola' as never);
    const regalo = { ...N, contexto: { genero: 'mujer', regalo: true, idioma: 'es-ES' } };
    expect(await enviarPregunta(regalo, 1, { plantilla: false })).toBe(false);
    expect(h.preguntaDeOrden).not.toHaveBeenCalled();
  });

  it('un nuevo de la V3 que no es regalo sigue igual: con OR1 en la cola devuelve true', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    h.altaNuevo.mockResolvedValueOnce('en-cola' as never);
    const nuevo = { ...N, contexto: { ...N.contexto, bienvenidaV3: true } };
    expect(await enviarPregunta(nuevo, 1, { plantilla: false })).toBe(true);
  });

  it('prendido pero no es la 1 de un acepto: flujo viejo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    await enviarPregunta({ ...N, estado: 'activo', dia_actual: 4 }, 5, { plantilla: false });
    expect(h.altaNuevo).not.toHaveBeenCalled();
  });
});
