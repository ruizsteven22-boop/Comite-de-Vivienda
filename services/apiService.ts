/**
 * Servicio de peticiones API con validación robusta.
 * Implementa la lógica para detectar cuando el servidor (WordPress u otro)
 * devuelve HTML en lugar de JSON, evitando el error "Unexpected token <".
 */

export const safeRequest = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(url, options);

    // 1. Verificar si la respuesta fue exitosa (status 200-299)
    if (!response.ok) {
      const errorBody = await response.text();
      const isHtml = errorBody.trim().startsWith('<');
      throw new Error(
        isHtml 
          ? `El servidor devolvió un error HTML (Status ${response.status}). Posible redirección o error de WordPress.` 
          : `Error del servidor: ${response.status}`
      );
    }

    // 2. Verificar el Content-Type antes de parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.trim().startsWith('<')) {
        throw new Error('La respuesta no es una respuesta JSON válida. El servidor envió HTML (posible página 404 o error PHP).');
      }
    }

    // 3. Parsear JSON con manejo de errores interno
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("[API Service Error]:", error);
    throw error;
  }
};

/**
 * Verifica si una cadena de texto es un JSON válido antes de procesarla.
 */
export const isValidJson = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.startsWith('<')) return false; // Es HTML
  try {
    JSON.parse(trimmed);
    return true;
  } catch (e) {
    return false;
  }
};
