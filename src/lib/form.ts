/**
 * Definição declarativa do funil. Para mudar perguntas, opções ou o
 * encadeamento condicional, edite apenas o array STEPS abaixo.
 *
 * Cada step aponta para o próximo através de `next`:
 *   - string  -> vai sempre para esse id
 *   - função  -> decide a partir da resposta (lógica condicional)
 *
 * Os ids reservados são "submit" (dispara o WhatsApp) e "disqualified".
 */

export type Answers = Record<string, string>;

export type Choice = { value: string; label: string };

type Base = {
  /** Rótulo curto usado na mensagem do WhatsApp. Ex.: "Nome". */
  summaryLabel: string;
  /** Se false, o step não entra na barra de progresso (telas informativas). */
  counted?: boolean;
};

export type Step = Base &
  (
    | {
        id: string;
        kind: "text" | "phone";
        question: string;
        placeholder: string;
        next: string;
      }
    | {
        id: string;
        kind: "choice";
        question: string;
        options: Choice[];
        next: string | ((value: string) => string);
      }
  );

export const FIRST_STEP = "nome";

export const STEPS: Step[] = [
  {
    id: "nome",
    kind: "text",
    summaryLabel: "Nome",
    question: "Qual é o seu nome?",
    placeholder: "Digite seu nome completo",
    next: "sequela",
  },
  {
    id: "sequela",
    kind: "choice",
    summaryLabel: "Sequela",
    question:
      "Você sofreu um acidente que deixou alguma sequela ou limitação física?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
    next: (v) => (v === "sim" ? "vinculo" : "disqualified"),
  },
  {
    id: "vinculo",
    kind: "choice",
    summaryLabel: "Vínculo",
    question: "Na época do acidente, qual era sua situação de trabalho?",
    options: [
      { value: "carteira", label: "Tinha carteira assinada" },
      { value: "agricultor", label: "Era Agricultor" },
      { value: "mei", label: "Era MEI, Autônomo" },
      { value: "desempregado", label: "Estava desempregado" },
    ],
    // Carteira assinada e agricultor já têm qualidade de segurado -> pula direto
    // para o INSS. MEI/autônomo e desempregado precisam checar vínculo anterior.
    next: (v) =>
      v === "carteira" || v === "agricultor" ? "inss" : "carteiraAnterior",
  },
  {
    id: "carteiraAnterior",
    kind: "choice",
    summaryLabel: "Carteira até 1 ano antes",
    question:
      "Até um ano antes do acidente, você trabalhou com carteira assinada por algum período?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
    next: (v) => (v === "sim" ? "inss" : "disqualified"),
  },
  {
    id: "inss",
    kind: "choice",
    summaryLabel: "INSS",
    question: "Na época do acidente, você buscou o INSS?",
    options: [
      { value: "afastado", label: "Fiquei afastado pelo INSS" },
      { value: "nao_busquei", label: "Não busquei o INSS" },
      { value: "negado", label: "Fui ao INSS mas fui negado" },
    ],
    next: "whatsapp",
  },
  {
    id: "whatsapp",
    kind: "phone",
    summaryLabel: "WhatsApp",
    question: "Qual seu WhatsApp?",
    placeholder: "(00) 00000-0000",
    next: "regiao",
  },
  {
    id: "regiao",
    kind: "choice",
    summaryLabel: "Região",
    question: "Qual parte do corpo foi afetada?",
    options: [
      { value: "braco", label: "Braço ou mão" },
      { value: "perna", label: "Perna ou pé" },
      { value: "coluna", label: "Coluna ou pescoço" },
      { value: "cabeca", label: "Cabeça ou visão" },
      { value: "outra", label: "Outra região" },
    ],
    next: "submit",
  },
];

export const stepById = (id: string) => STEPS.find((s) => s.id === id);

/** Total de perguntas do caminho mais longo — usado na barra de progresso. */
export const TOTAL_QUESTIONS = STEPS.filter((s) => s.counted !== false).length;

/** Resolve o próximo id a partir do step atual e da resposta dada. */
export function resolveNext(step: Step, value: string): string {
  return typeof step.next === "function" ? step.next(value) : step.next;
}

/** Converte o valor interno na label legível que vai para a mensagem. */
export function labelFor(step: Step, value: string): string {
  if (step.kind !== "choice") return value;
  return step.options.find((o) => o.value === value)?.label ?? value;
}
