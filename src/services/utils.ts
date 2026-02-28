
/**
 * Formatea un string de RUT agregando puntos y guion automáticamente.
 * Ejemplo: "12345678k" -> "12.345.678-k"
 */
export const formatRut = (value: string): string => {
  // Limpiar caracteres no permitidos (solo números y K/k)
  const cleanValue = value.replace(/[^0-9kK]/g, '');
  
  if (cleanValue.length === 0) return '';
  if (cleanValue.length === 1) return cleanValue;

  const dv = cleanValue.slice(-1);
  const body = cleanValue.slice(0, -1);
  
  // Agregar puntos al cuerpo
  let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv.toLowerCase()}`;
};

/**
 * Valida si un RUT tiene el formato correcto y el dígito verificador es válido (Modulo 11)
 */
export const isValidRut = (rut: string): boolean => {
  // Formato básico: 1.234.567-8 o 12.345.678-9
  if (!/^[0-9]{1,2}(\.[0-9]{3}){2}-[0-9kK]{1}$/.test(rut)) return false;
  
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toLowerCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  let dvStr = expectedDv.toString();
  if (expectedDv === 11) dvStr = '0';
  if (expectedDv === 10) dvStr = 'k';
  
  return dv === dvStr;
};
