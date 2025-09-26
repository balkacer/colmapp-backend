/**
 * Formatea un número de teléfono a formato E.164 para WhatsApp API.
 * 
 * - Elimina espacios, guiones y paréntesis.
 * - Se asegura de que comience con el código de país (por defecto +1).
 * - Retorna solo dígitos (sin +).
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '1'): string {
  if (!phone) return '';

  // quitar espacios, guiones, paréntesis y caracteres no numéricos
  let cleaned = phone.replace(/[^\d+]/g, '');

  // si empieza con + → quitarlo
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // si no empieza con código de país → añadirlo
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}