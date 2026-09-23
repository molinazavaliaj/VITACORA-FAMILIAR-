import { describe, it, expect } from 'vitest';
import { asuntoRecordatorioFrases, cuerpoRecordatorioFrases } from '../src/mail/frases.js';

// El recordatorio de «Su voz» a los 15 días, partido en dos según lo que compró
// la familia (textos aprobados por Naza el 23/09).
//
// Por qué se partió: con el portón de impresión (3t.26 fase 2), el libro impreso
// sale SOLO cuando la familia confirma la selección. El texto viejo decía lo
// contrario —"si no tocas nada, cuando se imprima va la lista que eligió el
// biógrafo"— y salía justo a quien no había confirmado: le decía "no hagas nada" a
// la única persona que tenía que hacer algo para que su libro impreso existiera.

describe('el recordatorio de las frases', () => {
  describe('cuando compró solo el PDF', () => {
    const cuerpo = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x/tablero/1', conImpreso: false });

    it('deja claro que no hay apuro: sin impreso, no hay nada que se cierre', () => {
      expect(cuerpo).toContain('No hay apuro');
      expect(cuerpo).toContain('quedan guardadas así hasta que decidas');
    });

    it('no habla de imprimir ni de confirmar: no le toca', () => {
      expect(cuerpo).not.toMatch(/se manda a imprimir|confirm/i);
    });

    it('ya no promete que se imprime lo que eligió el biógrafo (era mentira con el portón)', () => {
      expect(cuerpo).not.toContain('cuando se imprima va la lista');
      expect(cuerpo).not.toContain('No hay ninguna obligación');
    });
  });

  describe('cuando encargó el libro impreso', () => {
    const cuerpo = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x/tablero/1', conImpreso: true });

    it('dice lo único que importa: sin confirmar no se imprime', () => {
      expect(cuerpo).toContain('Se manda a imprimir cuando confirmes esta selección');
    });

    it('cuenta que las frases van impresas con su código', () => {
      expect(cuerpo).toContain('cada una lleva su código para escucharla');
    });

    it('le deja la salida fácil: si están bien, confirmarlas tal cual', () => {
      expect(cuerpo).toContain('confírmalas tal cual');
    });

    it('no le dice que no hay apuro, porque sí lo hay', () => {
      expect(cuerpo).not.toContain('No hay apuro');
    });
  });

  it('el asunto es el mismo para los dos: lo que cambia es qué tiene que hacer', () => {
    expect(asuntoRecordatorioFrases('abuela')).toContain('abuela');
  });

  it('sin decir qué compró, se asume lo más seguro: el texto sin apuro', () => {
    // Un `conImpreso` que no llega no puede terminar en "confirmá o no se imprime"
    // mandado a quien compró solo el PDF: eso lo dejaría esperando una acción que
    // no le corresponde.
    const cuerpo = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x' });
    expect(cuerpo).toContain('No hay apuro');
  });

  it('el nombre se escapa en los dos textos', () => {
    for (const conImpreso of [true, false]) {
      const cuerpo = cuerpoRecordatorioFrases({ comoLeDicen: '<b>abu</b>', enlace: 'https://x', conImpreso });
      expect(cuerpo).not.toContain('<b>abu</b>');
      expect(cuerpo).toContain('&lt;b&gt;abu&lt;/b&gt;');
    }
  });

  it('los dos hablan de «tú», como el resto de los mails de la casa', () => {
    for (const conImpreso of [true, false]) {
      const cuerpo = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x', conImpreso });
      expect(cuerpo).not.toMatch(/\b(podés|querés|tenés|sacá|poné)\b/i);
    }
  });
});
