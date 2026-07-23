/**
 * Dominio de Recordatorios (Fase 3.2).
 *
 * Toda la lógica es PURA y testeable: normalización de teléfonos a
 * formato internacional, plantillas de mensaje y construcción del
 * deep-link de WhatsApp. Sin HTTP, sin SQL y sin API de pago:
 * `wa.me` abre WhatsApp (web o app) con el mensaje ya escrito y el
 * usuario solo pulsa enviar.
 */

const TIPOS = Object.freeze({ VACUNA: 'vacuna', CITA: 'cita' });

/** Código de país por defecto (México). Configurable por clínica a futuro. */
const CODIGO_PAIS_DEFAULT = '52';

/**
 * Normaliza un teléfono a solo dígitos con código de país.
 * '55 1234-5678' → '525512345678' · '+52 55 1234 5678' → '525512345678'
 * @returns {string|null} null si no hay suficientes dígitos
 */
function normalizarTelefono(numero, codigoPais = CODIGO_PAIS_DEFAULT) {
  if (!numero) return null;
  const original = String(numero).trim();
  const teniaMas = original.startsWith('+');
  let digitos = original.replace(/\D/g, '');
  if (!digitos) return null;

  // Prefijo internacional 00 → quitarlo
  if (digitos.startsWith('00')) digitos = digitos.slice(2);

  // Un número local (10 dígitos en MX) necesita el código de país
  if (!teniaMas && digitos.length === 10) digitos = `${codigoPais}${digitos}`;

  // Demasiado corto para ser un teléfono válido
  if (digitos.length < 10) return null;
  return digitos;
}

/**
 * Convierte una fecha a Date en zona LOCAL.
 *
 * `new Date('2026-07-21')` se interpreta como UTC medianoche, que en
 * México (UTC-6) cae el día anterior: un recordatorio de hoy aparecería
 * como vencido. Por eso las fechas 'YYYY-MM-DD' se construyen por
 * componentes locales.
 */
const aFechaLocal = (fecha) => {
  if (!fecha) return null;
  if (fecha instanceof Date) return Number.isNaN(fecha.getTime()) ? null : new Date(fecha);
  const texto = String(fecha).trim();
  const soloFecha = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (soloFecha) {
    const [, a, m, d] = soloFecha;
    return new Date(Number(a), Number(m) - 1, Number(d));
  }
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtFecha = (fecha) => {
  if (!fecha) return '';
  const d = aFechaLocal(fecha);
  if (!d) return String(fecha);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const primerNombre = (nombre) => String(nombre || '').trim().split(/\s+/)[0] || '';

/**
 * Plantillas de mensaje por tipo. Cada una recibe los datos del
 * recordatorio y devuelve el texto listo para WhatsApp.
 * OCP: agregar un tipo nuevo = agregar una entrada aquí.
 */
const PLANTILLAS = Object.freeze({
  [TIPOS.VACUNA]: (d) =>
    `Hola ${primerNombre(d.tutor_nombre)} 👋\n\n` +
    `Te recordamos que *${d.paciente_nombre}* tiene programada su vacuna ` +
    `*${d.detalle}* para el *${fmtFecha(d.fecha)}*.\n\n` +
    `¿Te gustaría agendar la cita? Quedamos atentos.\n\n` +
    `— ${d.clinica_nombre || 'Tu clínica veterinaria'}`,

  [TIPOS.CITA]: (d) =>
    `Hola ${primerNombre(d.tutor_nombre)} 👋\n\n` +
    `Te confirmamos la cita de *${d.paciente_nombre}* el *${fmtFecha(d.fecha)}*` +
    `${d.hora ? ` a las *${d.hora}*` : ''}` +
    `${d.detalle ? `\nMotivo: ${d.detalle}` : ''}.\n\n` +
    `Si necesitas reprogramar, responde a este mensaje.\n\n` +
    `— ${d.clinica_nombre || 'Tu clínica veterinaria'}`,
});

class Recordatorio {
  /**
   * Construye el mensaje de un recordatorio según su tipo.
   * @returns {string}
   */
  static construirMensaje(datos) {
    const plantilla = PLANTILLAS[datos.tipo];
    if (!plantilla) {
      return `Recordatorio de ${datos.paciente_nombre || 'tu mascota'} para el ${fmtFecha(datos.fecha)}.`;
    }
    return plantilla(datos);
  }

  /**
   * Deep-link de WhatsApp con el mensaje pre-escrito.
   * @returns {string|null} null si el tutor no tiene teléfono utilizable
   */
  static construirEnlaceWhatsApp(datos, codigoPais = CODIGO_PAIS_DEFAULT) {
    const telefono = normalizarTelefono(datos.whatsapp || datos.telefono, codigoPais);
    if (!telefono) return null;
    const texto = encodeURIComponent(Recordatorio.construirMensaje(datos));
    return `https://wa.me/${telefono}?text=${texto}`;
  }

  /** Días que faltan (negativo si ya pasó); null si no hay fecha válida. */
  static diasRestantes(fecha, hoy = new Date()) {
    const objetivo = aFechaLocal(fecha);
    if (!objetivo) return null;
    objetivo.setHours(0, 0, 0, 0);
    const base = new Date(hoy);
    base.setHours(0, 0, 0, 0);
    return Math.round((objetivo - base) / 86_400_000);
  }

  /** Urgencia para ordenar/colorear: 'vencido' | 'hoy' | 'pronto' | 'proximo'. */
  static urgencia(fecha, hoy = new Date()) {
    const dias = Recordatorio.diasRestantes(fecha, hoy);
    if (dias === null) return 'proximo';
    if (dias < 0) return 'vencido';
    if (dias === 0) return 'hoy';
    if (dias <= 3) return 'pronto';
    return 'proximo';
  }
}

Recordatorio.TIPOS = TIPOS;
Recordatorio.normalizarTelefono = normalizarTelefono;
Recordatorio.CODIGO_PAIS_DEFAULT = CODIGO_PAIS_DEFAULT;

module.exports = Recordatorio;
