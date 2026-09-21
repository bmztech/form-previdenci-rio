import Funnel from "@/components/Funnel";
import { nextUnit } from "@/lib/aux-acidente/rotation";

// Precisa rodar no servidor a cada acesso pra pegar sua vez no rodízio —
// sem isso o Next serviria a página pré-renderizada e todo mundo cairia
// na mesma unidade.
export const dynamic = "force-dynamic";

export default function Home() {
  const { unit, number } = nextUnit();
  return <Funnel whatsappNumber={number} unit={unit} />;
}
