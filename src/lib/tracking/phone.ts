/**
 * Utilitários de telefone — genéricos, usados pelo step `kind: "phone"` de
 * qualquer funil (não dependem de STEPS de nenhum).
 */

/** Máscara de telefone brasileiro: (41) 99954-5084 */
export function maskPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Aceita fixo (10 dígitos) ou celular (11 dígitos). */
export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}
