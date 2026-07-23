const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Búsqueda global (Fase 4.1).
 *
 * Encapsula las reglas del término que escribe el usuario en el
 * command palette (Ctrl+K): cuándo una consulta es buscable, cómo se
 * traduce a un patrón LIKE seguro y qué tan relevante es cada
 * coincidencia. No conoce HTTP, SQL ni React.
 *
 * POO aplicada:
 *   - Encapsulación: el texto normalizado y su versión "plegada"
 *     (sin acentos ni mayúsculas) son privados; se exponen por getters.
 *   - Constructor estático `crear` que garantiza la invariante:
 *     ninguna Busqueda puede existir con menos de LONGITUD_MINIMA
 *     caracteres útiles (evita barrer la tabla con una sola letra).
 */
class Busqueda {
  /** Menos de esto no se consulta a la BD: el ruido supera a la señal. */
  static LONGITUD_MINIMA = 2;
  /** Resultados por tipo (paciente/tutor) si el cliente no pide otro tope. */
  static LIMITE_DEFAULT = 5;
  static LIMITE_MAX = 10;
  /** Longitud máxima aceptada: nadie busca una frase de 100 caracteres. */
  static LONGITUD_MAXIMA = 100;

  static TIPOS = Object.freeze({ PACIENTE: 'paciente', TUTOR: 'tutor' });

  /** Escalones de relevancia (mayor = mejor coincidencia). */
  static RELEVANCIA = Object.freeze({
    EXACTA: 100,
    PREFIJO: 75,
    PREFIJO_DE_PALABRA: 50,
    CONTIENE: 25,
    NULA: 0,
  });

  #texto;
  #plegado;

  constructor(texto) {
    this.#texto = texto;
    this.#plegado = Busqueda.plegar(texto);
  }

  /**
   * Crea una Busqueda validando la invariante de longitud.
   * @param {unknown} consulta — texto crudo tal como llega del cliente
   * @throws {ValidationError}
   */
  static crear(consulta) {
    const texto = Busqueda.#normalizar(consulta);
    if (texto.length < Busqueda.LONGITUD_MINIMA) {
      throw new ValidationError(
        `La búsqueda requiere al menos ${Busqueda.LONGITUD_MINIMA} caracteres`
      );
    }
    return new Busqueda(texto.slice(0, Busqueda.LONGITUD_MAXIMA));
  }

  /** Recorta y colapsa espacios internos ("  Fi   ru " → "Fi ru"). */
  static #normalizar(valor) {
    if (valor === undefined || valor === null) return '';
    return String(valor).trim().replace(/\s+/g, ' ');
  }

  /**
   * Versión comparable de un texto: minúsculas y sin diacríticos, para
   * que "Muñoz" y "munoz" o "Bruño" y "bruno" puntúen igual que en el
   * LIKE de MySQL (cuyas colaciones *_ci también ignoran acentos).
   */
  static plegar(texto) {
    if (texto === undefined || texto === null) return '';
    return String(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get texto() { return this.#texto; }
  get plegado() { return this.#plegado; }

  /**
   * Patrón para LIKE con los comodines de SQL escapados.
   *
   * Sin esto, un usuario que escribe `%` o `_` obtendría la tabla
   * entera (`%%%` casa con todo): el término del usuario es DATO, no
   * sintaxis. El backslash es el carácter de escape por defecto de LIKE
   * en MySQL; los valores siempre viajan como placeholders (?).
   */
  get patronLike() {
    const escapado = this.#texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
    return `%${escapado}%`;
  }

  /**
   * Qué tan bien casa `texto` con esta búsqueda.
   *
   * Ordenar por relevancia es lo que hace que escribir "fir" ponga a
   * "Firulais" arriba y no a "Alfirio": el SQL solo sabe de LIKE, el
   * ranking es una regla de negocio y vive aquí.
   *
   * @returns {number} uno de los escalones de Busqueda.RELEVANCIA
   */
  relevancia(texto) {
    const { EXACTA, PREFIJO, PREFIJO_DE_PALABRA, CONTIENE, NULA } = Busqueda.RELEVANCIA;
    const plegado = Busqueda.plegar(texto);
    if (!plegado) return NULA;
    if (plegado === this.#plegado) return EXACTA;
    if (plegado.startsWith(this.#plegado)) return PREFIJO;
    // Coincide con el inicio de alguna palabra (apellido, segundo nombre…)
    if (plegado.split(' ').some((palabra) => palabra.startsWith(this.#plegado))) {
      return PREFIJO_DE_PALABRA;
    }
    if (plegado.includes(this.#plegado)) return CONTIENE;
    return NULA;
  }

  /** La mejor relevancia entre varios campos candidatos. */
  mejorRelevancia(...textos) {
    return textos.reduce((mejor, texto) => Math.max(mejor, this.relevancia(texto)), 0);
  }

  /** Normaliza el tope de resultados pedido al rango permitido. */
  static limiteValido(limite) {
    const n = Number(limite);
    if (!Number.isFinite(n)) return Busqueda.LIMITE_DEFAULT;
    return Math.min(Math.max(Math.trunc(n), 1), Busqueda.LIMITE_MAX);
  }
}

module.exports = Busqueda;
