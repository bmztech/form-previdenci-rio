/**
 * Montagem da mensagem/link de WhatsApp do funil "adic-25".
 * `maskPhone`, `isValidPhone` e `readTracking` não dependem de STEPS —
 * são 100% genéricos, por isso são reaproveitados direto de `./whatsapp`
 * (import, sem alterar o arquivo original).
 */
import { WHATSAPP_NUMBER_ADIC25 } from "./config-adic25";
import { STEPS, labelFor, type Answers } from "./form-adic25";
import { isValidPhone, maskPhone, readTracking, type Tracking } from "./whatsapp";

export { isValidPhone, maskPhone, readTracking, type Tracking };

/**
 * Primeira linha da mensagem — resume o caso para quem for atender.
 * Só chega no "submit" quem foi qualificado (aposentado por invalidez que
 * recebe 13º), por isso sempre tem `motivo` respondido.
 */
export function buildHeadline(answers: Answers): string {
  const motivo = answers.motivo?.trim();
  if (!motivo) return "Caso novo pelo formulário adic-25 do site.";
  return `Caso: adicional de 25% — motivo da invalidez: ${motivo}`;
}

/** Monta o texto da mensagem que o lead envia para o escritório. */
export function buildMessage(answers: Answers, tracking: Tracking): string {
  const lines: string[] = [buildHeadline(answers), ""];

  for (const step of STEPS) {
    const value = answers[step.id];
    if (!value || step.hideInSummary) continue;
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
  whatsappNumber: string = WHATSAPP_NUMBER_ADIC25,
): string {
  const text = encodeURIComponent(buildMessage(answers, tracking));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
