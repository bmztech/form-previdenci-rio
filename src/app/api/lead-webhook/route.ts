/**
 * Proxy do lead pro webhook do BI (ver src/lib/lead-webhook.ts, que é quem
 * posta aqui). Existe pra requisição sair servidor→servidor: sem CORS no
 * navegador e sem expor o token de autenticação no código do cliente.
 *
 * Configuração 100% por variável de ambiente (sem defaults no código, pro
 * token não ficar no repositório):
 *   LEAD_WEBHOOK_URL   — URL do webhook do BI, sem query string
 *   LEAD_WEBHOOK_TOKEN — token; vai no header X-Webhook-Token e em `?token=`
 */

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const base = process.env.LEAD_WEBHOOK_URL;
  const token = process.env.LEAD_WEBHOOK_TOKEN;
  if (!base || !token) {
    console.error(
      "[lead-webhook] LEAD_WEBHOOK_URL/LEAD_WEBHOOK_TOKEN não configurados — lead descartado.",
    );
    return new Response(null, { status: 204 });
  }

  // `set` tolera uma URL que já venha com `?token=` (sobrescreve sem duplicar).
  const url = new URL(base);
  url.searchParams.set("token", token);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // A API do BI autentica pelo header X-Webhook-Token, com fallback
        // pro `?token=` da query string — enviamos os dois por redundância.
        "X-Webhook-Token": token,
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
