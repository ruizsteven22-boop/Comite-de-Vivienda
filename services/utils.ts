
/**
 * Formatea un string de RUT agregando puntos y guion automáticamente.
 * Ejemplo: "12345678k" -> "12.345.678-k"
 */
export const formatRut = (value: string): string => {
  // Limpiar caracteres no permitidos (solo números y K/k)
  const cleanValue = value.replace(/[^0-9kK]/g, '');
  
  if (cleanValue.length <= 1) return cleanValue;

  const dv = cleanValue.slice(-1);
  const body = cleanValue.slice(0, -1);
  
  // Agregar puntos al cuerpo
  let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv.toLowerCase()}`;
};

/**
 * Valida si un RUT tiene el formato correcto (opcionalmente se puede añadir validación modulo 11)
 */
export const isValidRutFormat = (rut: string): boolean => {
  const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/;
  return rutRegex.test(rut);
};
