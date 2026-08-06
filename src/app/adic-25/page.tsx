import type { Metadata } from "next";
import FunnelAdic25 from "@/components/FunnelAdic25";

// Sobrescreve o metadata do layout raiz só para esta rota — não mexe no
// título/descrição do formulário original.
export const metadata: Metadata = {
  title: "[placeholder] Título do formulário adic-25 | BMZ Advogados",
  description: "[placeholder] Descrição do formulário adic-25.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FunnelAdic25 />;
}
