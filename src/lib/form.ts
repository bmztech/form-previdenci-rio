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

export type Choice = {
  value: string;
  label: string;
  /**
   * A mesma opção escrita para caber no meio de uma frase, já com preposição.
   * Ex.: label "Braço ou mão" -> phrase "do braço ou mão", para render
   * "na região do braço ou mão". Sem isso, usamos a label em minúsculas.
   */
  phrase?: string;
};

/** Perguntas cujo enunciado depende do que o lead já respondeu. */
export type QuestionText = string | ((answers: Answers) => string);

type Base = {
  /** Rótulo curto usado na mensagem do WhatsApp. Ex.: "Nome". */
  summaryLabel: string;
  /** Se false, o step não entra na barra de progresso (telas informativas). */
  counted?: boolean;
  /** Se true, a resposta não vira uma linha na lista da mensagem. */
  hideInSummary?: boolean;
};

export type Step = Base &
  (
    | {
        id: string;
        kind: "text" | "phone";
        question: QuestionText;
        placeholder: string;
        next: string;
      }
    | {
        id: string;
        kind: "choice";
        question: QuestionText;
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
      { value: "braco", label: "Braço ou mão", phrase: "do braço ou mão" },
      { value: "perna", label: "Perna ou pé", phrase: "da perna ou pé" },
      {
        value: "coluna",
        label: "Coluna ou pescoço",
        phrase: "da coluna ou pescoço",
      },
      {
        value: "cabeca",
        label: "Cabeça ou visão",
        phrase: "da cabeça ou visão",
      },
      // "Outra região" não nomeia nada, então a frase vira só "afetada".
      { value: "outra", label: "Outra região", phrase: "afetada" },
    ],
    next: "lesao",
  },
  {
    id: "lesao",
    kind: "text",
    summaryLabel: "Lesão",
    // Já aparece por extenso na primeira linha da mensagem.
    hideInSummary: true,
    question: (answers) =>
      `Em poucas palavras, qual é a sua lesão na região ${phraseFor("regiao", answers)}?`,
    placeholder: "Ex.: fratura que não consolidou",
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

/**
 * Versão da resposta pronta para entrar no meio de uma frase.
 * Ex.: phraseFor("regiao", { regiao: "braco" }) -> "do braço ou mão".
 */
export function phraseFor(stepId: string, answers: Answers): string {
  const step = stepById(stepId);
  if (!step || step.kind !== "choice") return "";

  const option = step.options.find((o) => o.value === answers[stepId]);
  if (!option) return "";

  return option.phrase ?? option.label.toLowerCase();
}

/** Resolve o enunciado, que pode depender das respostas anteriores. */
export function questionOf(step: Step, answers: Answers): string {
  return typeof step.question === "function"
    ? step.question(answers)
    : step.question;
}
