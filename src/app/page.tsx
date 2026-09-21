import type { Metadata } from "next";
import Linktree from "@/components/Linktree";
import { LINKTREE_LINKS } from "@/lib/linktree/config";
import { buildTrackedHref } from "@/lib/tracking/links";

// Sobrescreve o metadata do layout raiz (que é do funil aux-acidente) só
// para esta rota — o linktree não é um formulário.
export const metadata: Metadata = {
  title: "BMZ Advogados | Direito Previdenciário",
  description: "Escolha o assunto do seu atendimento com a BMZ Advogados.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const from = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") from.set(key, value);
  }

  const links = LINKTREE_LINKS.map((link) => ({
    ...link,
    href: buildTrackedHref(link.href, from),
  }));

  return <Linktree links={links} />;
}
