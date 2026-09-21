/**
 * Propagação de UTMs entre páginas do site — usado pelo linktree ("/") e
 * pelo rodízio ("/go/aux-acidente") para levar as UTMs de entrada, intactas,
 * até o destino final.
 */

import { TRACKING_PARAMS } from "./utm";

/**
 * Filtra `from` pra só os parâmetros de rastreamento conhecidos
 * (`TRACKING_PARAMS`) — mesma allowlist que `readTracking()` usa. Isso evita
 * que a URL carregue lixo pra frente e impede que alguém force um parâmetro
 * reservado (ex.: `time`) via query string do link de entrada.
 */
export function forwardTracking(from: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of TRACKING_PARAMS) {
    const value = from.get(key);
    if (value) out.set(key, value);
  }
  return out;
}

/**
 * Monta o href de destino (caminho interno ou URL absoluta) carregando as
 * UTMs de `from` mais quaisquer parâmetros extras (ex.: `time`).
 */
export function buildTrackedHref(
  target: string,
  from: URLSearchParams,
  extra?: Record<string, string>,
): string {
  const params = forwardTracking(from);
  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, value);
  }

  const query = params.toString();
  if (!query) return target;

  return `${target}${target.includes("?") ? "&" : "?"}${query}`;
}
