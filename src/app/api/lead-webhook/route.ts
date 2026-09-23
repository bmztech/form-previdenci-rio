/**
 * Proxy do lead pro webhook do BI (ver src/lib/lead-webhook.ts, que é quem
 * posta aqui). Existe pra requisição sair servidor→servidor: sem CORS no
 * navegador e sem expor o token de autenticação no código do cliente.
 *
 * HOTFIX: URL e token hardcoded (sem ler .env) porque as variáveis de
 * ambiente não estão sendo lidas no deploy da Hostinger. Quando o .env de
 * produção funcionar, voltar pra process.env.LEAD_WEBHOOK_URL (sem query
 * string) e process.env.LEAD_WEBHOOK_TOKEN.
 */

const WEBHOOK_URL = "https://api-bi.bmztech.com.br/api/webhooks/leads/form";
const WEBHOOK_TOKEN =
  "yHvuUetxW6pOalE3Py67GnnL2gHduyDpPTiVVjG2TxrKisj8ts3xA5lgIyTLmXST";

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const url = new URL(WEBHOOK_URL);
  url.searchParams.set("token", WEBHOOK_TOKEN);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // A API do BI autentica pelo header X-Webhook-Token, com fallback
        // pro `?token=` da query string — enviamos os dois por redundância.
        "X-Webhook-Token": WEBHOOK_TOKEN,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error(
        `[lead-webhook] BI respondeu ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("[lead-webhook] falha ao encaminhar o lead pro BI:", error);
  }

  return new Response(null, { status: 204 });
}
