# BMZ Advogados — Formulários de qualificação de leads

Funis condicionais (tipo "typeform") que qualificam leads jurídicos e, no
final, abrem o WhatsApp do escritório com todas as respostas e as UTMs da
campanha já preenchidas na mensagem.

Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript. Cada página é
100% estática/client-side — não há backend, banco nem armazenamento de dados
em servidor. Tudo o que existe é `sessionStorage`/`localStorage` no navegador
do lead (UTMs da sessão e "já enviei esse formulário antes").

> **Antes de mexer no código**: este repo está em uma versão do Next.js mais
> recente que a que você conhece. Convenções e APIs podem divergir do seu
> treino — veja `node_modules/next/dist/docs/` antes de assumir comportamento
> do App Router. Ver `AGENTS.md`.

## Rodando localmente

```bash
npm install
npm run dev
```

```bash
npm run build   # build de produção
npm run lint    # eslint
npm test        # vitest run (uma vez)
npm run test:watch
```

---

## Arquitetura em uma frase

**Um "motor de funil" genérico (`Funnel.tsx` / `FunnelAdic25.tsx`) executa uma
máquina de estados definida declarativamente em `src/lib/form*.ts`, e ao final
monta uma URL `wa.me` com a mensagem pronta (`src/lib/whatsapp*.ts`).**

Cada formulário é um conjunto isolado de 3 arquivos + 1 componente + 1 ou mais
rotas. Não há import cruzado entre formulários — cada um é uma cópia
independente do padrão, exceto pelo que é genuinamente compartilhado (veja
"O que é compartilhado" abaixo). Isso é proposital: a ideia é poder
mexer/quebrar um formulário sem risco de afetar outro.

### Formulários existentes

| Formulário           | Rota(s)                      | Steps                | Config                    | Mensagem WhatsApp        | Componente             |
| --------------------- | ----------------------------- | --------------------- | -------------------------- | -------------------------- | ------------------------ |
| Auxílio-acidente (original) | `/`, `/aux-a`, `/aux-b`, `/aux-c` | `src/lib/form.ts`      | `src/lib/config.ts`        | `src/lib/whatsapp.ts`      | `src/components/Funnel.tsx` |
| Adicional de 25%      | `/adic-25`                    | `src/lib/form-adic25.ts` | `src/lib/config-adic25.ts` | `src/lib/whatsapp-adic25.ts` | `src/components/FunnelAdic25.tsx` |

`/`, `/aux-a`, `/aux-b` e `/aux-c` são o **mesmo** funil (`Funnel.tsx` +
`form.ts`), só mudando o número de WhatsApp de destino:

- `/` sorteia aleatoriamente entre as 3 unidades (`WHATSAPP_NUMBERS` em
  `config.ts`) — usado quando o anúncio não aponta pra uma unidade fixa.
- `/aux-a`, `/aux-b`, `/aux-c` fixam a unidade via prop `whatsappNumber`
  passada pela `page.tsx` da rota (ver `src/app/aux-a/page.tsx`).

`/adic-25` é um formulário **completamente diferente** (outra pergunta,
outra qualificação, outro número de WhatsApp fixo), que só reaproveita peças
genéricas do formulário original — não os steps nem a lógica de negócio.

### O que é compartilhado entre formulários

| Arquivo                          | Por quê é compartilhado                                                  |
| --------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/config.ts`               | `INSTAGRAM_URL`, `SITE_URL`, `TRACKING_PARAMS` — mesmos em todo o site. `adic-25` importa direto daqui. |
| `src/lib/whatsapp.ts` → `maskPhone`, `isValidPhone`, `readTracking` | Puramente genéricas, não dependem de `STEPS`. `whatsapp-adic25.ts` faz `import { ... } from "./whatsapp"` em vez de duplicar. |
| `src/lib/pixel.ts`                 | Meta Pixel é um só, por site.                                             |
| `src/lib/submission-status.ts`     | Genérico, mas cada formulário usa um `FormGroup` diferente (ver abaixo) — o *código* é compartilhado, o *estado* não. |
| `src/components/MetaPixel.tsx`     | Montado uma vez em `layout.tsx`, cobre todas as rotas.                    |
| `src/app/layout.tsx`, `globals.css` | Casca visual (fonte, cores, `<html>/<body>`) comum a todas as rotas.      |

Tudo o resto (`STEPS`, `buildMessage`, `buildHeadline`, textos das telas,
número de WhatsApp de destino) é **duplicado de propósito** por formulário —
editar um não deve exigir entender ou tocar no outro.

---

## Como o motor do funil funciona (`Funnel.tsx`)

Cada componente de funil é uma máquina de estados de tela + um "cursor" de
step, tudo em `useState` local (sem lib de formulário, sem state manager):

```
Screen = "intro" | "question" | "disqualified" | "done"
```

1. **`intro`** — tela de abertura (headline + botão). Se o navegador já
   enviou esse *grupo* de formulário antes (`useHasSubmitted`), mostra
   `AlreadySubmitted` no lugar.
2. **`question`** — renderiza o `step` atual (`currentId` → `stepById`).
   - `kind: "choice"` → botões (atalho de teclado A/B/C…).
   - `kind: "text" | "phone"` → input controlado + botão "Continuar".
   - `kind: "info"` (só existe em `form-adic25.ts`) → texto informativo sem
     coletar resposta, só um botão "Continuar".
   - Responder chama `answer(value)` → grava em `answers`, resolve o próximo
     id via `resolveNext(step, value)` e navega com `goTo`.
   - `goTo` trata os dois ids reservados: `"disqualified"` muda a tela,
     `"submit"` chama `finish()` (monta a URL do WhatsApp e vai pra `done`).
   - `history` guarda o caminho percorrido, usado por "← Voltar" e pela barra
     de progresso.
3. **`disqualified`** — lead não se qualifica; CTA leva pro Instagram.
4. **`done`** — tela final; o clique no CTA chama `trackLead()` (Meta Pixel)
   e `markSubmitted(FORM_GROUP)`, então navega pro `wa.me` já montado.

**Importante**: a navegação para o WhatsApp acontece por clique real do
usuário (link `<a href>`), não por redirect automático — isso garante que o
gesto abra o app nativo no celular em vez de cair no navegador, e dá tempo do
lead ler o aviso de que a mensagem só chega no escritório depois que ele
mesmo apertar "enviar" dentro do WhatsApp.

---

## As duas telas de "agradecimento" (`Done` e `AlreadySubmitted`)

Cada componente de funil tem **duas** telas de encerramento com propósitos
diferentes — fácil de confundir porque as duas têm tom de agradecimento:

| Tela                | Quando aparece                                                              | O que diz                                                                 | O que faz |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------- |
| **`Done`**             | Lead terminou de responder tudo (`screen === "done"`), *antes* de ir pro WhatsApp | "Falta só um passo! Envie a mensagem pronta na próxima tela do WhatsApp" — não é bem um agradecimento, é a instrução final | O botão "Falar com um advogado agora" chama `trackLead()` (Meta Pixel) **e** `markSubmitted(FORM_GROUP)`, depois navega pro link `wa.me` já montado. **É aqui que o envio é de fato marcado como concluído.** |
| **`AlreadySubmitted`** | Lead abre a tela `intro` de novo (mesma sessão ou sessão nova, mesmo navegador) e `useHasSubmitted(FORM_GROUP)` já é `true` | "Agradecemos o seu contato! Já recebemos as suas informações..." — esse sim é o agradecimento propriamente dito | Substitui a `Intro` inteira — o lead nem vê as perguntas de novo. Só tem o CTA pro Instagram, sem link de WhatsApp (não faz sentido reabrir a conversa). |

Ou seja: **`Done` é o fim do funil de quem está respondendo agora**;
**`AlreadySubmitted` é o que substitui a abertura de quem volta depois de já
ter enviado**. A ordem de causa e efeito é: clicar no CTA da tela `Done` é o
que grava `markSubmitted`, e é essa marca que faz a próxima visita (ou o
reload da `intro`) cair em `AlreadySubmitted` em vez de `Intro`.

Isso vale por **grupo** de formulário, não por rota — ver
`src/lib/submission-status.ts` abaixo para o detalhe de quais rotas
compartilham o mesmo grupo.

Os textos de cada tela ficam nos componentes `Done`/`AlreadySubmitted` no
fim de `Funnel.tsx`/`FunnelAdic25.tsx` — são independentes por formulário
(mesmo padrão de "duplicado de propósito" do resto do repo). No `adic-25`,
a tela `Disqualified` também varia o texto conforme qual confirmação
desqualificou o lead (`disqualifyMessage(answers)`), o que não existe no
funil original.

---

## `src/lib/form*.ts` — definição declarativa do funil

Isso é o que você edita para mudar perguntas, opções ou ramificação. **Não
mexe em componente para isso.**

```ts
export type Step = Base & (
  | { id, kind: "text" | "phone", question, placeholder, next: string }
  | { id, kind: "choice", question, options: Choice[], next: string | ((value: string) => string) }
  | { id, kind: "info", message, buttonLabel?, next: string }  // só em form-adic25.ts
);
```

- **`next` como string** → sempre vai para esse id.
- **`next` como função `(value) => id`** → ramifica pela resposta dada. É
  aqui que mora toda a lógica condicional do funil.
- **`id: "submit"`** (reservado) → dispara `finish()`, monta a URL do
  WhatsApp e mostra a tela final.
- **`id: "disqualified"`** (reservado) → mostra a tela de desqualificação.
- **`counted: false`** → o step não conta na barra de progresso (usado em
  telas informativas e perguntas de confirmação, que não são "perguntas de
  verdade" do ponto de vista do lead).
- **`hideInSummary: true`** → a resposta não vira uma linha na mensagem do
  WhatsApp (normalmente porque já aparece por extenso no cabeçalho, via
  `buildHeadline`).
- **`question`/`message` como função `(answers) => string`** → enunciado
  dinâmico, pode citar uma resposta anterior (ex.: "Só pra confirmar: você
  recebe **{resposta da pergunta anterior}**?").
- **`Choice.phrase`** → versão da opção que encaixa no meio de uma frase
  (`"Braço ou mão"` → `"do braço ou mão"`). Sem isso, cai para a label em
  minúsculas — então, se a frase ficar estranha, é provável que falte
  preencher o `phrase`.

Funções utilitárias exportadas (mesmo contrato nos dois arquivos de steps):
`stepById`, `resolveNext`, `labelFor`, `phraseFor`, `questionOf`,
`TOTAL_QUESTIONS`.

### O funil "auxílio-acidente" (`form.ts`)

```
Abertura
  └─ Nome
      └─ Sofreu acidente com sequela?
          ├─ Não ──────────────────────────────────► Desqualificado
          └─ Sim
              └─ Situação de trabalho na época?
                  ├─ Carteira assinada / Agricultor ──────────┐
                  └─ MEI, Autônomo / Desempregado             │
                      └─ Carteira assinada no ano anterior?   │
                          ├─ Não ───────────────────► Desqualificado
                          └─ Sim ─────────────────────────────┤
                                                              ▼
                                                 Buscou o INSS?
                                                     └─ WhatsApp
                                                         └─ Parte do corpo
                                                             └─ Qual é a lesão
                                                                 └─ ✅ abre o wa.me
```

Só o step `vinculo` muda o tamanho do caminho (7 ou 8 perguntas) — por isso
`Funnel.tsx` calcula o total da barra de progresso com `pathTotal(answers)`
em vez de usar uma constante fixa. Se você adicionar outra ramificação que
mude o número de perguntas do caminho, atualize essa função.

### O funil "adicional de 25%" (`form-adic25.ts`)

```
Nome → WhatsApp → [aviso informativo]
  └─ P1: Você recebe...
      ├─ Aposentadoria por invalidez ──────────────┐
      └─ BPC/LOAS ou Outros                         │
          └─ Confirma? ── Sim ──► Desqualificado    │
                       └─ Não ──► volta pra P1       │
                                                     ▼
                                          P2: Recebe décimo terceiro?
                                              ├─ Sim ──────────────┐
                                              └─ Não                │
                                                  └─ Confirma? ── Sim ──► Desqualificado
                                                               └─ Não ──► volta pra P2
                                                                                     ▼
                                                                          P3: Motivo da invalidez
                                                                              └─ ✅ abre o wa.me
```

Padrão "pergunta + confirmação" em vez de desqualificar direto: perguntas que
desqualificam (P1 e P2) passam por uma tela de confirmação antes — reduz
desqualificação por clique errado. Repare que, depois de confirmar uma
resposta que desqualifica, o botão "← Voltar" some (`canGoBack` em
`FunnelAdic25.tsx`): não dá pra reabrir o funil a partir da tela de
desqualificação.

Como nenhuma ramificação deste funil muda o número de perguntas do caminho,
a barra de progresso usa a constante `TOTAL_QUESTIONS` direto (ver comentário
`TODO` em `FunnelAdic25.tsx` caso isso mude no futuro).

---

## `src/lib/whatsapp*.ts` — mensagem e link do WhatsApp

- **`buildHeadline(answers)`** — primeira linha da mensagem, resume o caso
  pro advogado bater o olho antes de ler o resto (ex.: *"Caso: fratura que
  não consolidou na região do braço ou mão"*). Lógica específica por
  formulário — cada `whatsapp-*.ts` tem a sua.
- **`buildMessage(answers, tracking)`** — percorre `STEPS` na ordem e escreve
  uma linha `Label: valor` para cada resposta existente. **Só entram as
  perguntas que o lead realmente viu** (ramos não percorridos não têm
  resposta em `answers`) **e que não têm `hideInSummary`**. Depois, se houver
  UTMs, adiciona o bloco `— origem —`.
- **`buildWhatsAppUrl(answers, tracking, whatsappNumber?)`** — `encodeURIComponent`
  na mensagem e monta `https://wa.me/<numero>?text=<mensagem>`.
- **`maskPhone` / `isValidPhone`** — máscara `(41) 99954-5084` e validação de
  10 ou 11 dígitos. Genéricas, vêm de `whatsapp.ts` mesmo no funil `adic-25`.
- **`readTracking()`** — lê `TRACKING_PARAMS` (`utm_*`, `fbclid`, `gclid`) da
  query string, mescla com o que já estava salvo em `sessionStorage`
  (chave `bmz_tracking`) e persiste de novo. `referrer` e `landing_page` são
  capturados automaticamente, só na primeira visita da sessão. Isso é o que
  faz as UTMs sobreviverem a um reload no meio do funil.

### Exemplo de mensagem gerada (funil original)

```
Caso: perdi dois dedos da mão direita na região do braço ou mão

Nome: Carlos Henrique Alves
Sequela: Sim
Vínculo: Era MEI, Autônomo
Carteira até 1 ano antes: Sim
INSS: Fui ao INSS mas fui negado
WhatsApp: (41) 99987-1234
Região: Braço ou mão

— origem —
landing_page: https://…
utm_source: facebook
utm_medium: cpc
utm_campaign: inss-acidente
utm_content: criativo-03
utm_term: auxilio
fbclid: IwAR…
```

---

## `src/lib/submission-status.ts` — "já enviei esse formulário antes"

Marca no `localStorage` do navegador (`bmz_submitted_<group>`) que o lead já
concluiu um **grupo** de formulário, pra não fazer ele repetir tudo se cair
de novo em outro anúncio do mesmo grupo.

```ts
export type FormGroup = "aux-acidente" | "adic25";
```

- `/`, `/aux-a`, `/aux-b`, `/aux-c` compartilham o grupo `"aux-acidente"` —
  enviar por qualquer uma dessas rotas marca as outras três como "já
  enviado" também (é por isso que existe um `FORM_GROUP` no componente, não
  por rota).
- `/adic-25` usa o grupo `"adic25"`, independente do anterior — enviar um não
  afeta o outro.
- Se criar um novo formulário, decida se ele deve ter grupo próprio (padrão)
  ou compartilhar um grupo existente (só se for genuinamente "a mesma oferta,
  outra origem de tráfego", como acontece entre `aux-a/b/c`).

`useHasSubmitted` usa `useSyncExternalStore` para não gerar mismatch de
hidratação SSR (retorna sempre `false` no servidor/primeiro paint, depois
sincroniza com o valor real do `localStorage`).

---

## Rastreamento (UTMs, fbclid, gclid)

Lidos da query string na primeira carga (`readTracking`, ver acima) e
guardados em `sessionStorage`. Para adicionar outro parâmetro, inclua na
lista `TRACKING_PARAMS` em `src/lib/config.ts` — vale para todos os
formulários, já que é compartilhado.

## Meta Pixel

Pixel `1289395722733398` (`META_PIXEL_ID` em `src/lib/pixel.ts`), instalado
em `src/components/MetaPixel.tsx` (código base + `noscript`) e montado uma
única vez em `layout.tsx` — cobre todas as rotas/formulários.

| Evento     | Quando dispara                              | Onde                                             |
| ---------- | -------------------------------------------- | -------------------------------------------------- |
| `PageView` | Toda carga de página                         | `MetaPixel.tsx`                                    |
| `Lead`     | Clique em "Falar com um advogado agora" na tela final | `trackLead()` (`pixel.ts`), chamado no `onClick` de `Done` em cada componente de funil |

O `Lead` marca quem terminou o funil **e** foi para o WhatsApp — é o evento
para otimizar campanha. Não dispara em quem é desqualificado nem em quem
abandona no meio.

Vale saber: o clique navega para o `wa.me` na mesma aba, então a requisição
do `Lead` corre junto com a saída da página. Na prática o navegador entrega,
mas se o volume no Gerenciador de Anúncios vier abaixo do esperado, dá pra
disparar o evento quando a tela final aparece (dentro de `finish()`) em vez
de no clique — mais garantido, porém conta também quem vê a tela e não clica.

---

## Como adicionar um novo formulário/funil

Este repo cresce por **cópia guiada**, não por generalização — cada
formulário novo é isolado dos outros. Use `adic-25` como referência. Passos:

1. **Steps**: crie `src/lib/form-<nome>.ts` copiando `form-adic25.ts` (ou
   `form.ts`, se não precisar de telas `kind: "info"`). Reescreva o array
   `STEPS` com as perguntas, opções e ramificação (`next`) do novo funil.
2. **Config**: crie `src/lib/config-<nome>.ts` só com o que for específico
   (tipicamente o número de WhatsApp de destino). Reaproveite
   `INSTAGRAM_URL`, `SITE_URL` e `TRACKING_PARAMS` de `src/lib/config.ts`
   direto.
3. **Mensagem**: crie `src/lib/whatsapp-<nome>.ts` copiando
   `whatsapp-adic25.ts`. Reescreva só `buildHeadline` (o resumo do caso).
   Reexporte `maskPhone`, `isValidPhone`, `readTracking` de `./whatsapp` sem
   duplicar.
4. **Componente**: crie `src/components/Funnel<Nome>.tsx` copiando
   `FunnelAdic25.tsx`. Troque os imports para os arquivos do passo 1–3,
   ajuste `FORM_GROUP` (novo grupo em `submission-status.ts` — adicione o
   literal em `FormGroup`) e reescreva os textos das telas (`Intro`,
   `Disqualified`, `Done`, `AlreadySubmitted`).
5. **Rota**: crie `src/app/<nome>/page.tsx` renderizando o componente do
   passo 4. Se precisar de metadata específica (título/descrição/robots),
   sobrescreva `export const metadata` nessa página — ela tem prioridade
   sobre o `layout.tsx` raiz (ver `src/app/adic-25/page.tsx` como exemplo).
6. **Teste** (opcional, mas o padrão do repo): se a lógica de mensagem tiver
   algo não trivial, copie a estrutura de `src/lib/whatsapp.test.ts`.

Não tente extrair um "componente de funil genérico parametrizável" — já foi
avaliado implicitamente pelo padrão do repo (dois funis, zero abstração
compartilhada além do que já é genérico) e o custo de indireção supera o
ganho com só 2–3 formulários. Reavalie isso apenas se o número de formulários
crescer muito e as coincidências entre eles pararem de ser coincidência.

---

## Rotas (`src/app`)

| Rota         | Componente                              | Observação                                                             |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `/`           | `Funnel` (sem `whatsappNumber`)             | Sorteia unidade A/B/C aleatoriamente a cada sessão.                        |
| `/aux-a`      | `Funnel whatsappNumber={WHATSAPP_NUMBERS.a}` | Fixo na unidade A.                                                          |
| `/aux-b`      | `Funnel whatsappNumber={WHATSAPP_NUMBERS.b}` | Fixo na unidade B.                                                          |
| `/aux-c`      | `Funnel whatsappNumber={WHATSAPP_NUMBERS.c}` | Fixo na unidade C.                                                          |
| `/adic-25`    | `FunnelAdic25`                              | Metadata própria (`export const metadata` na `page.tsx`), `robots: noindex`. |

`layout.tsx` (raiz) define o `<html>/<body>`, monta `MetaPixel` (todas as
rotas) e define metadata **padrão** (`robots: noindex` — a página é destino
de anúncio, não deve competir com o site institucional na busca).

---

## O que mexer — referência rápida

| Preciso mudar…                                          | Arquivo                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| Número de WhatsApp, Instagram, UTMs lidas (globais)         | `src/lib/config.ts`                                             |
| Número de WhatsApp do funil `adic-25`                       | `src/lib/config-adic25.ts`                                      |
| Perguntas, opções e lógica condicional (funil original)     | `src/lib/form.ts`                                                |
| Perguntas, opções e lógica condicional (funil `adic-25`)     | `src/lib/form-adic25.ts`                                         |
| Formato da mensagem enviada (funil original)                 | `src/lib/whatsapp.ts`                                            |
| Formato da mensagem enviada (funil `adic-25`)                 | `src/lib/whatsapp-adic25.ts`                                      |
| Textos de abertura/desqualificação/final (funil original)     | `src/components/Funnel.tsx`                                      |
| Textos de abertura/desqualificação/final (funil `adic-25`)     | `src/components/FunnelAdic25.tsx`                                 |
| Cores, fonte, animação de transição de tela                  | `src/app/globals.css` (tokens `@theme`)                          |
| Título/descrição/indexação de uma rota específica            | `export const metadata` na `page.tsx` da rota                    |
| Pixel do Meta (ID, eventos)                                  | `src/lib/pixel.ts`, `src/components/MetaPixel.tsx`                |

`WHATSAPP_NUMBER` (padrão do funil original) está como `554268235732` —
(42) 6823-5732, conta verificada no WhatsApp como "Bmz Advogados".

---

## Deploy

```bash
npx vercel --prod
```

Ou conecte o repositório em vercel.com — o preset do Next.js é detectado
sozinho, sem variáveis de ambiente para configurar.

Todas as rotas estão com `robots: noindex` por padrão (destino de anúncio,
não deve competir com o site institucional na busca). Ajuste por rota via
`metadata` se algum formulário precisar ser indexável.
