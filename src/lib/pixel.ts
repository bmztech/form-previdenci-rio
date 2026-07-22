/** Meta Pixel — ID da conta de anúncios da BMZ. */
export const META_PIXEL_ID = "1289395722733398";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Conversão principal: o lead terminou o funil e foi falar com o escritório.
 * Disparado no clique do botão da tela final, em `Funnel.tsx`.
 *
 * O `?.` é proposital — bloqueador de anúncio ou falha de rede deixam `fbq`
 * indefinido, e nesse caso o formulário tem que continuar funcionando.
 */
export function trackLead(): void {
  window.fbq?.("track", "Lead");
}
