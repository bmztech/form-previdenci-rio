/**
 * ---------------------------------------------------------------------------
 * CONFIGURAÇÃO — edite apenas este arquivo para trocar o número de destino.
 * ---------------------------------------------------------------------------
 * INSTAGRAM_URL, SITE_URL e TRACKING_PARAMS são compartilhados entre todos
 * os funis — vivem em `@/lib/site/config` e `@/lib/tracking/utm`.
 */

/**
 * Número que recebe os leads no WhatsApp.
 * Formato: código do país + DDD + número, apenas dígitos.
 * Ex.: (42) 6823-5732  ->  "554268235732"
 */
export const WHATSAPP_NUMBER = "554268235732";

/**
 * Números por unidade, usados nas rotas /aux-a, /aux-b e /aux-c — cada uma
 * envia o lead para um número diferente. A rota raiz "/" também usa esse
 * mapa, mas por rodízio sequencial (ver `./rotation.ts`).
 */
export const WHATSAPP_NUMBERS = {
  a: "554268235828", // BMZ A
  b: "554268235828", // BMZ B
  c: "554268235828", // BMZ C
} as const;
