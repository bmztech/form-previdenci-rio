# BMZ Advogados — Formulário de qualificação (INSS)

Funil condicional que qualifica leads de auxílio-acidente e, no final, abre o
WhatsApp do escritório com todas as respostas e as UTMs da campanha já
preenchidas na mensagem.

Next.js 16 (App Router) + Tailwind 4. A página é 100% estática — não há backend,
banco nem armazenamento de dados.

## Rodando localmente

```bash
npm install
npm run dev
```

## O que mexer

| Preciso mudar…                                  | Arquivo                     |
| ----------------------------------------------- | --------------------------- |
| Número do WhatsApp, Instagram, UTMs lidas       | `src/lib/config.ts`         |
| Perguntas, opções e a lógica condicional        | `src/lib/form.ts`           |
| Formato da mensagem enviada                     | `src/lib/whatsapp.ts`       |
| Textos da abertura e da tela de desqualificação | `src/components/Funnel.tsx` |

`WHATSAPP_NUMBER` está como `554268235732` — (42) 6823-5732, conta verificada
no WhatsApp como "Bmz Advogados".

## O funil

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

Para mudar qualquer ramificação, edite o campo `next` do step correspondente em
`src/lib/form.ts` — ele aceita um id fixo ou uma função que decide pela resposta.

## Mensagem gerada

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

A primeira linha resume o caso (`buildHeadline`, em `src/lib/whatsapp.ts`)
juntando a lesão descrita pelo lead com a região afetada. A região entra na
frase pelo campo `phrase` da opção, em `src/lib/form.ts` — é ele que faz
"Braço ou mão" virar "do braço ou mão". Se adicionar uma região nova, preencha
o `phrase` junto, senão a frase sai com a label em minúsculas.

Só entram as linhas que existem: perguntas que o lead não viu (por causa da
condicional) e UTMs ausentes são omitidas. A lesão não vira uma linha própria
porque já aparece por extenso no cabeçalho — é o que faz a flag
`hideInSummary` no step.

### Rastreamento

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`
e `gclid` são lidos da query string na primeira carga e guardados em
`sessionStorage`, então sobrevivem a um reload no meio do preenchimento.
`landing_page` e `referrer` são capturados automaticamente.

Para adicionar outro parâmetro, inclua na lista `TRACKING_PARAMS` em
`src/lib/config.ts`.

## Deploy na Vercel

```bash
npx vercel --prod
```

Ou conecte o repositório em vercel.com — o preset do Next.js é detectado
sozinho, sem variáveis de ambiente para configurar.

A página está com `robots: noindex` (`src/app/layout.tsx`), já que é destino de
anúncio e não deve competir com o site institucional na busca. Remova se quiser
indexar.

## Meta Pixel / Google Ads

Ainda não há pixel instalado. Para adicionar, coloque o script em
`src/app/layout.tsx` usando `next/script` e dispare o evento de conversão dentro
de `finish()`, em `src/components/Funnel.tsx` — é o ponto exato em que o lead
completa o funil.
