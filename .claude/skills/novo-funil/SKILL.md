---
name: novo-funil
description: Cria um novo formulário/funil de qualificação de leads seguindo o padrão do repo (form-*.ts, config-*.ts, whatsapp-*.ts, componente Funnel*.tsx, rota). Use quando o usuário pedir para criar um novo formulário, funil, landing de qualificação ou duplicar o adic-25/aux-acidente para outra oferta.
---

# Criar um novo funil

Este repo cresce por **cópia guiada**, não por generalização. Cada
formulário é isolado (não importa nem depende de outro, exceto o que é
genuinamente compartilhado). Não tente criar um "componente de funil
genérico parametrizável" — já foi avaliado e descartado; ver `README.md`
("Como adicionar um novo formulário/funil") para o racional completo. Este
skill executa exatamente esse playbook.

Use `src/components/FunnelAdic25.tsx` + `src/lib/form-adic25.ts` +
`src/lib/config-adic25.ts` + `src/lib/whatsapp-adic25.ts` como referência de
cópia — é o exemplo mais completo (tem `kind: "info"`, telas de confirmação,
mensagem de desqualificação variável).

## 1. Reunir informações antes de escrever código

Se o usuário não tiver dado tudo isso, pergunte antes de criar arquivos:

- **Slug do funil** (ex.: `adic-25` → usado em nomes de arquivo/rota:
  `form-<slug>.ts`, `/<slug>`). Prefira algo curto, kebab-case.
- **Nome em PascalCase** para o componente (ex.: `adic25` → `Adic25`,
  `revisao-vida-toda` → `RevisaoVidaToda`).
- **Perguntas e ramificação**: qual a sequência de perguntas, quais opções
  cada uma tem, e em que resposta o lead é desqualificado. Peça isso como um
  fluxo (pode ser texto corrido ou um diagrama tipo o do README) — é o
  conteúdo de `STEPS`.
- **Número de WhatsApp de destino** (só dígitos, código do país + DDD).
- **Textos de tela**: headline da intro, texto de desqualificação, se muda
  conforme o motivo (como o `adic-25` faz com `disqualifyMessage`).
- **Grupo de "já enviado"**: por padrão, todo funil novo ganha um `FormGroup`
  próprio (não reaproveita `"aux-acidente"` nem `"adic25"`). Só compartilhe
  um grupo existente se for genuinamente "a mesma oferta, outra origem de
  tráfego" (como `aux-a/b/c`) — confirme com o usuário antes de reaproveitar.
- **Rota(s)**: normalmente uma só (`/<slug>`), mas pode ser mais de uma se
  houver variantes por unidade, como `aux-a/b/c`.

Não invente perguntas de negócio (critérios de qualificação, textos
jurídicos) — isso tem que vir do usuário.

## 2. Criar `src/lib/form-<slug>.ts`

Copie a estrutura de `src/lib/form-adic25.ts` (tem o tipo `Step` mais
completo, com `kind: "info"`). Se o funil não precisar de telas
informativas, pode copiar de `src/lib/form.ts` em vez disso.

Reescreva o array `STEPS` com as perguntas do passo 1. Regras do formato
(ver README, seção "`src/lib/form*.ts`"):

- `next` como string → vai sempre pra esse id; `next` como função
  `(value) => id` → ramifica pela resposta.
- `id: "submit"` (reservado) → fecha o funil e monta o WhatsApp.
- `id: "disqualified"` (reservado) → mostra a tela de desqualificação.
- `counted: false` em telas informativas/de confirmação, pra não inflarem a
  barra de progresso.
- `hideInSummary: true` em respostas que já aparecem por extenso no
  cabeçalho da mensagem (`buildHeadline`).
- Preencha `Choice.phrase` sempre que a label não ficar natural em minúsculas
  no meio de uma frase.

Mantenha as mesmas funções utilitárias exportadas (`stepById`, `resolveNext`,
`labelFor`, `phraseFor`, `questionOf`, `TOTAL_QUESTIONS`, e `answerLabel` se
houver telas de confirmação) — o componente depende desse contrato.

## 3. Criar `src/lib/config-<slug>.ts`

Só o que for específico deste funil — tipicamente:

```ts
export const WHATSAPP_NUMBER_<SLUG> = "55...";
```

`INSTAGRAM_URL`, `SITE_URL` e `TRACKING_PARAMS` vêm direto de
`src/lib/config.ts` — não duplique.

## 4. Criar `src/lib/whatsapp-<slug>.ts`

Copie `src/lib/whatsapp-adic25.ts`. Reexporte o que é genérico do arquivo
original em vez de duplicar:

```ts
export { isValidPhone, maskPhone, readTracking, type Tracking } from "./whatsapp";
```

Reescreva só `buildHeadline` (resumo do caso na primeira linha da mensagem)
e o `whatsappNumber` default de `buildWhatsAppUrl` (aponta pro
`WHATSAPP_NUMBER_<SLUG>` do passo 3). `buildMessage` normalmente não precisa
mudar — já itera `STEPS` genericamente.

## 5. Criar `src/components/Funnel<Nome>.tsx`

Copie `src/components/FunnelAdic25.tsx` inteiro. Ajuste:

- Imports para os arquivos dos passos 2–4.
- `FORM_GROUP` — string nova. Adicione esse literal em `FormGroup` (union
  type) em `src/lib/submission-status.ts`.
- Se nenhuma ramificação do funil mudar o número de perguntas do caminho,
  mantenha `total = TOTAL_QUESTIONS`. Se mudar (como o step `vinculo` do
  funil original), troque por uma função `pathTotal(answers)` — ver
  `Funnel.tsx` como referência.
- Reescreva os textos de `Intro`, `Disqualified` (e `disqualifyMessage` se a
  desqualificação tiver mais de um motivo), `Done` e `AlreadySubmitted` com
  o conteúdo do passo 1. Não precisa reescrever a lógica de estado
  (`useState`, `goTo`, `answer`, `submitInput`, `goBack`, atalhos de
  teclado) — isso é o motor genérico, só copie como está.

## 6. Criar a rota `src/app/<slug>/page.tsx`

```tsx
import Funnel<Nome> from "@/components/Funnel<Nome>";

export default function Page() {
  return <Funnel<Nome> />;
}
```

Se precisar de título/descrição própria (normalmente sim, pra não competir
com a metadata do funil original), sobrescreva com `export const metadata`
nessa página — ela tem prioridade sobre `layout.tsx` raiz (ver
`src/app/adic-25/page.tsx`). Padrão do repo é `robots: { index: false, follow: false }`
em toda rota de formulário (destino de anúncio).

## 7. Verificar

- `npm run lint` e `npx tsc --noEmit` (ou `npm run build`) para pegar erros
  de tipo/import.
- Rode o skill `preview-mensagem` (se existir) ou escreva um teste rápido
  pra conferir o texto da mensagem de WhatsApp gerada com um caminho de
  exemplo.
- Se a lógica de `buildHeadline`/`buildMessage` tiver algo não trivial, copie
  a estrutura de `src/lib/whatsapp.test.ts` pra um `whatsapp-<slug>.test.ts`.
- Depois de criar tudo, adicione uma linha na tabela "Formulários existentes"
  e na tabela "O que mexer" do `README.md` para o funil novo — o README é a
  fonte de verdade da arquitetura, não deixe ele ficar desatualizado.
