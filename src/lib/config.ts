/**
 * ---------------------------------------------------------------------------
 * CONFIGURAÇÃO — edite apenas este arquivo para trocar número, links e textos.
 * ---------------------------------------------------------------------------
 */

/**
 * Número que recebe os leads no WhatsApp.
 * Formato: código do país + DDD + número, apenas dígitos.
 * Ex.: (42) 6823-5732  ->  "554268235732"
 */
export const WHATSAPP_NUMBER = "554268235732";

/**
 * Números por unidade, usados nas rotas /aux-a, /aux-b e /aux-c — cada uma
 * envia o lead para um número diferente.
 */
export const WHATSAPP_NUMBERS = {
  a: "554268250715", // BMZ A
  b: "554268235732", // BMZ B
  c: "554268235828", // BMZ C
} as const;

/** Link do Instagram exibido na tela de desqualificação. */
export const INSTAGRAM_URL = "https://www.instagram.com/bmz.advogados/";

/** Site institucional (rodapé). */
export const SITE_URL = "https://bmzadvogados.adv.br/";

/** Parâmetros de rastreamento capturados da URL e enviados na mensagem. */
export const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

export type TrackingParam = (typeof TRACKING_PARAMS)[number];
