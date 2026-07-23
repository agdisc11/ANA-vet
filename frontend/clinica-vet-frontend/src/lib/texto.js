/**
 * Utilidades de texto para búsqueda insensible a acentos y mayúsculas.
 *
 * Espejo en el frontend de `domain/Busqueda.plegar` del backend: así el
 * filtrado local de acciones del command palette ordena y resalta con
 * el mismo criterio que usa el servidor para pacientes y tutores.
 */

/** "José Ramírez" → "jose ramirez" */
export function plegar(texto) {
  if (texto === undefined || texto === null) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Pliega carácter a carácter y devuelve, además del texto plegado, el
 * mapa de posiciones hacia el texto ORIGINAL.
 *
 * Hace falta porque plegar cambia la longitud ("José" en NFD ocupa 5
 * caracteres y al quitar el acento quedan 4): sin el mapa, resaltar la
 * coincidencia sobre el texto original marcaría el tramo equivocado.
 */
function plegarConMapa(texto) {
  let plegado = '';
  const mapa = [];
  for (let i = 0; i < texto.length; i++) {
    for (const caracter of plegar(texto[i])) {
      plegado += caracter;
      mapa.push(i);
    }
  }
  return { plegado, mapa };
}

/**
 * Localiza la consulta dentro de `texto` ignorando acentos y mayúsculas.
 *
 * @param {string} texto
 * @param {string} consultaPlegada — consulta ya pasada por plegar()
 * @returns {{ inicio: number, fin: number } | null} índices sobre el texto original
 */
export function encontrarCoincidencia(texto, consultaPlegada) {
  if (!texto || !consultaPlegada) return null;
  const { plegado, mapa } = plegarConMapa(String(texto));
  const inicio = plegado.indexOf(consultaPlegada);
  if (inicio === -1) return null;
  return {
    inicio: mapa[inicio],
    fin: mapa[inicio + consultaPlegada.length - 1] + 1,
  };
}
