import { randomBytes } from 'crypto';

/**
 * Genera un número de orden hexadecimal único.
 * @param length longitud en caracteres del código (default: 8 → 4 bytes)
 * @returns string en hex (ej: "A3F9C1B2")
 */
export function generateOrderNumber(length: number = 8): string {
  // length/2 porque cada byte = 2 caracteres en hex
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .toUpperCase()
    .slice(0, length);
}