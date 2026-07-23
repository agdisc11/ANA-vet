import { useEffect, useState } from 'react';

/**
 * Difiere un valor hasta que deja de cambiar durante `ms`.
 *
 * En la búsqueda global evita una petición por tecla: solo se consulta
 * al servidor cuando el usuario hace una pausa al teclear.
 *
 * @param {*} valor
 * @param {number} ms
 */
export function useDebounce(valor, ms = 250) {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setDiferido(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);

  return diferido;
}
