// Lógica pura de registro: validación, normalización de teléfono y
// construcción de los payloads a insertar. Sin llamadas a red ni a Supabase,
// para poder probarla sin mocks pesados.

export type Region = 'ES' | 'AR';

export interface ArbolInput {
  padres?: string;
  hermanos?: string;
  conyuge?: string;
  hijos?: string;
}

export interface ContextoInput {
  lugarNacimiento?: string;
  anioNacimiento?: number;
  oficio?: string;
  datosExtra?: string;
  arbol?: ArbolInput;
}

export interface NarradorInput {
  nombre?: string;
  comoLeDicen?: string;
  telefonoWhatsapp?: string;
  horaPreferida?: string;
  zonaHoraria?: string;
  contexto?: ContextoInput;
}

export interface RegistroBody {
  nombreComprador?: string;
  vinculoComprador?: string;
  region?: string;
  narrador?: NarradorInput;
}

export interface FamiliaAInsertar {
  nombre: string;
  region: Region;
}

export interface NarradorAInsertar {
  nombre: string;
  como_le_dicen: string;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, unknown> & { arbol?: Record<string, string> };
  estado: 'invitado';
}

export type ResultadoValidacion =
  | { ok: true; familia: FamiliaAInsertar; narrador: NarradorAInsertar }
  | { ok: false; status: number; mensaje: string };

const REGION_CONFIG: Record<Region, { zonaHoraria: string }> = {
  ES: { zonaHoraria: 'Europe/Madrid' },
  AR: { zonaHoraria: 'America/Argentina/Buenos_Aires' },
};

const HORA_PREFERIDA_DEFAULT = '10:00';
const ANIO_MIN = 1900;
const ANIO_MAX = 2015;

export function normalizarTelefono(telefono: string, region: Region): string {
  const limpio = telefono.trim().replace(/[\s-]/g, '');
  if (limpio.startsWith('+')) return limpio;
  const soloDigitos = limpio.replace(/\D/g, '');
  const prefijo = region === 'AR' ? '+549' : '+34';
  return `${prefijo}${soloDigitos}`;
}

function esNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function validarYConstruir(body: RegistroBody): ResultadoValidacion {
  if (!esNoVacio(body?.nombreComprador)) {
    return { ok: false, status: 400, mensaje: 'Falta el nombre de quien regala la bitácora.' };
  }
  if (!esNoVacio(body?.vinculoComprador)) {
    return { ok: false, status: 400, mensaje: 'Falta contar qué es del narrador.' };
  }
  if (body?.region !== 'ES' && body?.region !== 'AR') {
    return { ok: false, status: 400, mensaje: 'La región debe ser España o Argentina.' };
  }
  const region = body.region as Region;

  const narrador = body.narrador;
  if (!narrador || !esNoVacio(narrador.nombre)) {
    return { ok: false, status: 400, mensaje: 'Falta el nombre del narrador.' };
  }
  if (!esNoVacio(narrador.comoLeDicen)) {
    return { ok: false, status: 400, mensaje: 'Falta contar cómo le dicen al narrador.' };
  }
  if (!esNoVacio(narrador.telefonoWhatsapp)) {
    return { ok: false, status: 400, mensaje: 'Falta el WhatsApp del narrador.' };
  }

  const contexto = narrador.contexto ?? {};

  if (contexto.anioNacimiento !== undefined) {
    const anio = contexto.anioNacimiento;
    if (
      typeof anio !== 'number' ||
      !Number.isInteger(anio) ||
      anio < ANIO_MIN ||
      anio > ANIO_MAX
    ) {
      return {
        ok: false,
        status: 400,
        mensaje: `El año de nacimiento debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`,
      };
    }
  }

  const telefono = normalizarTelefono(narrador.telefonoWhatsapp, region);
  const zonaHoraria = esNoVacio(narrador.zonaHoraria)
    ? narrador.zonaHoraria
    : REGION_CONFIG[region].zonaHoraria;
  const horaPreferida = esNoVacio(narrador.horaPreferida)
    ? narrador.horaPreferida
    : HORA_PREFERIDA_DEFAULT;

  const arbol = contexto.arbol ?? {};
  const arbolLimpio: Record<string, string> = {};
  if (esNoVacio(arbol.padres)) arbolLimpio.padres = arbol.padres.trim();
  if (esNoVacio(arbol.hermanos)) arbolLimpio.hermanos = arbol.hermanos.trim();
  if (esNoVacio(arbol.conyuge)) arbolLimpio.conyuge = arbol.conyuge.trim();
  if (esNoVacio(arbol.hijos)) arbolLimpio.hijos = arbol.hijos.trim();

  const contextoFinal: Record<string, unknown> & { arbol?: Record<string, string> } = {
    vinculoComprador: body.vinculoComprador.trim(),
  };
  if (esNoVacio(contexto.lugarNacimiento)) {
    contextoFinal.lugarNacimiento = contexto.lugarNacimiento.trim();
  }
  if (contexto.anioNacimiento !== undefined) {
    contextoFinal.anioNacimiento = contexto.anioNacimiento;
  }
  if (esNoVacio(contexto.oficio)) {
    contextoFinal.oficio = contexto.oficio.trim();
  }
  if (esNoVacio(contexto.datosExtra)) {
    contextoFinal.datosExtra = contexto.datosExtra.trim();
  }
  if (Object.keys(arbolLimpio).length > 0) {
    contextoFinal.arbol = arbolLimpio;
  }

  return {
    ok: true,
    familia: {
      nombre: body.nombreComprador.trim(),
      region,
    },
    narrador: {
      nombre: narrador.nombre.trim(),
      como_le_dicen: narrador.comoLeDicen.trim(),
      telefono_whatsapp: telefono,
      hora_preferida: horaPreferida,
      zona_horaria: zonaHoraria,
      contexto: contextoFinal,
      estado: 'invitado',
    },
  };
}
