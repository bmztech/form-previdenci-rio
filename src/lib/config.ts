/**
 * ---------------------------------------------------------------------------
 * CONFIGURAÇÃO — edite apenas este arquivo para trocar número, links e textos.
 * ---------------------------------------------------------------------------
 */

/**
 * Número que recebe os leads no WhatsApp.
 * Formato: código do país + DDD + número, apenas dígitos.
 * Ex.: (41) 99954-5084  ->  "5541999545084"
 *
 * TODO: substituir pelo número definitivo do escritório.
 */
export const WHATSAPP_NUMBER = "5541999545084";

/** Link do Instagram exibido na tela de desqualificação. */
export const INSTAGRAM_URL = "https://www.instagram.com/bmzadvogados/";

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
