const Busqueda = require('../domain/Busqueda');

/**
 * Servicio de búsqueda global (Fase 4.1 — command palette Ctrl+K).
 *
 * SOLID aplicado:
 *   - SRP: solo orquesta y unifica; el ranking es del dominio (Busqueda)
 *     y el SQL de cada tabla sigue viviendo en SU repositorio.
 *   - DIP: recibe los repositorios inyectados; no crea ninguno.
 *   - OCP: añadir un tipo buscable (p. ej. productos de inventario) es
 *     sumar un repositorio al constructor y un mapeador privado, sin
 *     tocar `buscar` más que para incluirlo en el Promise.all.
 *
 * Multi-tenant: `clinicaId` viaja a cada repositorio, que lo aplica en
 * su WHERE. Ninguna consulta puede devolver datos de otra clínica.
 *
 * El servicio NO decide rutas de la SPA: devuelve resultados semánticos
 * (tipo + id + textos) y el frontend, dueño de su router, los traduce a
 * URLs. Así un cambio de rutas no obliga a tocar el backend.
 */
class BusquedaService {
  #pacientes;
  #tutores;

  constructor({ pacienteRepository, tutorRepository }) {
    this.#pacientes = pacienteRepository;
    this.#tutores = tutorRepository;
  }

  /**
   * Busca pacientes y tutores de la clínica y los devuelve unificados
   * y ordenados por relevancia.
   *
   * @param {number} clinicaId
   * @param {{ q: string, limite?: number }} opciones
   * @returns {Promise<{ q: string, total: number, resultados: object[] }>}
   * @throws {ValidationError} si la consulta es demasiado corta
   */
  async buscar(clinicaId, { q, limite } = {}) {
    const busqueda = Busqueda.crear(q);
    const tope = Busqueda.limiteValido(limite);

    // En paralelo: son tablas independientes, no hay razón para serializar.
    const [pacientes, tutores] = await Promise.all([
      this.#pacientes.buscarGlobal(clinicaId, busqueda.patronLike, tope),
      this.#tutores.buscarGlobal(clinicaId, busqueda.patronLike, tope),
    ]);

    const resultados = [
      ...pacientes.map((fila) => BusquedaService.#mapearPaciente(fila, busqueda)),
      ...tutores.map((fila) => BusquedaService.#mapearTutor(fila, busqueda)),
    ].sort(BusquedaService.#porRelevancia);

    return { q: busqueda.texto, total: resultados.length, resultados };
  }

  /**
   * Orden del palette: primero lo más relevante; a igual relevancia los
   * pacientes antes que los tutores (en una veterinaria un nombre suele
   * ser el de la mascota) y, en último término, alfabético.
   */
  static #porRelevancia(a, b) {
    if (b.relevancia !== a.relevancia) return b.relevancia - a.relevancia;
    if (a.tipo !== b.tipo) return a.tipo === Busqueda.TIPOS.PACIENTE ? -1 : 1;
    return a.titulo.localeCompare(b.titulo, 'es');
  }

  static #mapearPaciente(fila, busqueda) {
    const tutor = BusquedaService.#limpiar(fila.tutor);
    // Coincidir por el nombre del tutor vale la mitad: el resultado es
    // pertinente, pero menos que un acierto en el nombre del paciente.
    const relevancia = Math.max(
      busqueda.mejorRelevancia(fila.nombre, fila.microchip),
      Math.round(busqueda.relevancia(tutor) / 2)
    );

    return {
      tipo: Busqueda.TIPOS.PACIENTE,
      id: fila.id,
      titulo: fila.nombre,
      subtitulo: [fila.especie, fila.raza].filter(Boolean).join(' · ') || null,
      detalle: tutor ? `Tutor: ${tutor}` : null,
      relevancia,
      meta: {
        especie: fila.especie ?? null,
        raza: fila.raza ?? null,
        microchip: fila.microchip ?? null,
        tutor_id: fila.tutor_id ?? null,
        tutor: tutor || null,
      },
    };
  }

  static #mapearTutor(fila, busqueda) {
    const nombreCompleto = BusquedaService.#limpiar(`${fila.nombre ?? ''} ${fila.apellidos ?? ''}`);
    const contacto = fila.telefono || fila.whatsapp || fila.correo || null;
    const pacientes = Number(fila.pacientes ?? 0);

    return {
      tipo: Busqueda.TIPOS.TUTOR,
      id: fila.id,
      titulo: nombreCompleto,
      subtitulo: contacto,
      detalle: `${pacientes} paciente${pacientes === 1 ? '' : 's'}`,
      relevancia: busqueda.mejorRelevancia(
        nombreCompleto, fila.telefono, fila.whatsapp, fila.correo, fila.codigo
      ),
      meta: {
        telefono: fila.telefono ?? null,
        whatsapp: fila.whatsapp ?? null,
        correo: fila.correo ?? null,
        codigo: fila.codigo ?? null,
        estatus: fila.estatus ?? null,
        pacientes,
      },
    };
  }

  /** Colapsa espacios sobrantes (un tutor sin apellidos deja "Carlos "). */
  static #limpiar(texto) {
    return String(texto ?? '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = BusquedaService;
