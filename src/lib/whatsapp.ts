import { TRACKING_PARAMS, WHATSAPP_NUMBER } from "./config";
import { STEPS, labelFor, phraseFor, type Answers } from "./form";

export type Tracking = Partial<Record<string, string>>;

/**
 * Lê os parâmetros de rastreamento da URL atual.
 * Também recupera o que já tinha sido salvo na sessão, para o caso do lead
 * navegar/recarregar e a URL perder as UTMs no meio do caminho.
 */
export function readTracking(): Tracking {
  if (typeof window === "undefined") return {};

  const STORAGE_KEY = "bmz_tracking";
  const params = new URLSearchParams(window.location.search);

  let stored: Tracking = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    stored = {};
  }

  const tracking: Tracking = { ...stored };
  for (const key of TRACKING_PARAMS) {
    const value = params.get(key);
    if (value) tracking[key] = value;
  }

  // Referrer só é registrado na primeira visita, quando ainda não há nada salvo.
  if (!tracking.referrer && document.referrer) {
    tracking.referrer = document.referrer;
  }
  if (!tracking.landing_page) {
    tracking.landing_page = window.location.origin + window.location.pathname;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
  } catch {
    // sessionStorage indisponível (modo privado/iframe) — segue sem persistir.
  }

  return tracking;
}

/**
 * Primeira linha da mensagem — resume o caso para o advogado bater o olho:
 * "Caso: fratura que não consolidou na região do braço ou mão".
 */
export function buildHeadline(answers: Answers): string {
  const lesao = answers.lesao?.trim();
  if (!lesao) return "Caso novo pelo formulário do site.";

  const regiao = phraseFor("regiao", answers);
  return regiao ? `Caso: ${lesao} na região ${regiao}` : `Caso: ${lesao}`;
}

/** Monta o texto da mensagem que o lead envia para o escritório. */
export function buildMessage(answers: Answers, tracking: Tracking): string {
  const lines: string[] = [buildHeadline(answers), ""];

  for (const step of STEPS) {
    const value = answers[step.id];
    if (!value || step.hideInSummary) continue; // não exibido neste caminho
    lines.push(`${step.summaryLabel}: ${labelFor(step, value)}`);
  }

  const trackingEntries = Object.entries(tracking).filter(([, v]) => v);
  if (trackingEntries.length > 0) {
    lines.push("", "— origem —");
    for (const [key, value] of trackingEntries) {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join("\n");
}

/** Link wa.me pronto para abrir a conversa já com a mensagem preenchida. */
export function buildWhatsAppUrl(
  answers: Answers,
  tracking: Tracking,
  whatsappNumber: string = WHATSAPP_NUMBER,
): string {
  const text = encodeURIComponent(buildMessage(answers, tracking));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}

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
