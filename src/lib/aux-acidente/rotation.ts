/**
 * Rodízio sequencial das unidades A/B/C, usado pelo route handler
 * `/go/aux-acidente` (destino do card "Auxílio-Acidente" no linktree da
 * rota raiz "/"). Uma posição da fila é consumida por clique, não por
 * pageview. Ordem de chegada: 1º lead -> A, 2º -> B, 3º -> C, 4º -> A...
 *
 * O contador vive em memória no processo Node — funciona porque a produção
 * roda um único processo (Hostinger, `next start`). Se um dia isso virar
 * múltiplas instâncias (serverless, réplicas), cada uma teria seu próprio
 * contador e a divisão deixaria de ser igualitária; nesse cenário o
 * contador precisa sair pra um store externo (Redis/Upstash).
 */

import { WHATSAPP_NUMBERS } from "./config";

export type Unit = keyof typeof WHATSAPP_NUMBERS;

const UNITS = Object.keys(WHATSAPP_NUMBERS) as Unit[];

type RotationState = { index: number };

// Guardado no globalThis pra sobreviver ao hot-reload do dev, que reavalia
// o módulo e zeraria um contador declarado como variável solta.
const globalForRotation = globalThis as typeof globalThis & {
  __bmzRotation?: RotationState;
};

const state: RotationState = (globalForRotation.__bmzRotation ??= {
  index: 0,
});

/** Próxima unidade da fila: a, b, c, a, b, c... por ordem de chegada. */
export function nextUnit(): { unit: Unit; number: string } {
  const unit = UNITS[state.index];
  state.index = (state.index + 1) % UNITS.length;
  return { unit, number: WHATSAPP_NUMBERS[unit] };
}

/** Reinicia a fila pro início — usado só nos testes. */
export function resetRotation(): void {
  state.index = 0;
}
