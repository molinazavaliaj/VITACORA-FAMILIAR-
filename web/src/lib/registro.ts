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
// HH:MM de 24hs. Un string basura acá rompe el scheduler del entrevistador
// (cruza servicios vía la base compartida), así que se valida en la frontera.
const HORA_PREFERIDA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function esZonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}
const ANIO_MIN = 1900;
const ANIO_MAX = 2015;

// E.164: '+' seguido de 8 a 15 dígitos. Suficiente para rechazar entradas
// sin números (texto suelto) o con muy pocos dígitos como para ser un
// WhatsApp real, sin ser estricto sobre el plan de numeración exacto.
const TELEFONO_E164 = /^\+\d{8,15}$/;

export function normalizarTelefono(telefono: string, region: Region): string {
  const limpio = telefono.trim().replace(/[\s-]/g, '');
  if (limpio.startsWith('+')) {
    // WhatsApp exige +549 para móviles argentinos y el 9 se olvida seguido:
    // +54 + 10 dígitos que no arrancan en 9 es un número nacional sin el 9.
    if (region === 'AR' && /^\+54(?!9)\d{10}$/.test(limpio)) {
      return `+549${limpio.slice(3)}`;
    }
    return limpio;
  }
  let soloDigitos = limpio.replace(/\D/g, '');
  if (region === 'AR') {
    // Formato local: "011 15 5555-1234". El 0 es el prefijo de larga
    // distancia y el 15 el de móvil — ninguno viaja en el número
    // internacional. El 15 solo se saca cuando el resultado queda en los 10
    // dígitos de un número nacional (código de área de 2 a 4 dígitos), para
    // no mutilar un número que casualmente contiene "15".
    if (soloDigitos.startsWith('0')) soloDigitos = soloDigitos.slice(1);
    if (soloDigitos.length === 12) {
      for (const largoArea of [2, 3, 4]) {
        if (soloDigitos.slice(largoArea, largoArea + 2) === '15') {
          soloDigitos = soloDigitos.slice(0, largoArea) + soloDigitos.slice(largoArea + 2);
          break;
        }
      }
    }
  }
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
  if (!TELEFONO_E164.test(telefono)) {
    return {
      ok: false,
      status: 400,
      mensaje: 'El WhatsApp no parece un número válido. Revísalo e intenta de nuevo.',
    };
  }

  if (esNoVacio(narrador.zonaHoraria) && !esZonaHorariaValida(narrador.zonaHoraria)) {
    return {
      ok: false,
      status: 400,
      mensaje: 'La zona horaria no es válida.',
    };
  }
  if (esNoVacio(narrador.horaPreferida) && !HORA_PREFERIDA_RE.test(narrador.horaPreferida.trim())) {
    return {
      ok: false,
      status: 400,
      mensaje: 'La hora preferida debe tener formato HH:MM, por ejemplo 10:00.',
    };
  }

  const zonaHoraria = esNoVacio(narrador.zonaHoraria)
    ? narrador.zonaHoraria
    : REGION_CONFIG[region].zonaHoraria;
  const horaPreferida = esNoVacio(narrador.horaPreferida)
    ? narrador.horaPreferida.trim()
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
