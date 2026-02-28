
/**
 * Servicio de peticiones API con validación robusta.
 * Implementa la lógica para detectar cuando el servidor (WordPress u otro)
 * devuelve HTML en lugar de JSON, evitando el error "Unexpected token <".
 */

export const safeRequest = async <T>(url: string, options?: RequestInit): Promise<T> => {
  console.log(`[safeRequest] Fetching: ${url}`);
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);

    // 1. Verificar si la respuesta fue exitosa (status 200-299)
    if (!response.ok) {
      const errorBody = await response.text();
      const isHtml = errorBody.trim().startsWith('<');
      throw new Error(
        isHtml 
          ? `El servidor devolvió un error HTML (Status ${response.status}). Posible redirección o error de configuración.` 
          : `Error del servidor: ${response.status}`
      );
    }

    // 2. Verificar el Content-Type antes de parsear
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    if (!isValidJson(text)) {
      throw new Error('La respuesta no es una respuesta JSON válida. El servidor envió contenido no estructurado o HTML.');
    }

    // 3. Parsear JSON con manejo de errores interno
    return JSON.parse(text) as T;
  } catch (error) {
    clearTimeout(id);
    console.error("[API Service Error]:", error);
    throw error;
  }
};

/**
 * Verifica de forma estricta si una cadena de texto es un JSON válido 
 * y no un documento HTML (que suele causar el error "Unexpected token <").
 */
export const isValidJson = (str: string | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  const trimmed = str.trim();
  
  // Si empieza con < o <!DOCTYPE, definitivamente es HTML
  if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
    return false;
  }

  // Verificar estructura básica de JSON (debe empezar con { o [)
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch (e) {
    return false;
  }
};
