import Image from "next/image";
import { SITE_URL } from "@/lib/site/config";

export type LinktreeItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  external?: boolean;
};

/**
 * Página raiz "/" — menu de entrada com um card por oferta. Server
 * component puro: os hrefs (já com as UTMs anexadas) vêm prontos de
 * `page.tsx`, então funciona sem depender de hidratação no cliente.
 */
export default function Linktree({ links }: { links: LinktreeItem[] }) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <Image
            src="/logo-bmz.webp"
            alt="BMZ Advogados — Belin, Medeiros &amp; Zaiats"
            width={200}
            height={100}
            priority
            className="h-11 w-auto"
          />
        </header>

        <div className="animate-step-in px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="text-xs font-bold tracking-[0.18em] text-green uppercase">
            Fale com a BMZ
          </p>

          <h1 className="mt-3 text-3xl leading-tight font-bold text-navy sm:text-4xl">
            Como podemos te ajudar?
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink">
            Escolha o assunto do seu atendimento abaixo.
          </p>

          <nav className="mt-8 flex flex-col gap-3 text-left">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex w-full items-center justify-between gap-4 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-green hover:shadow-md focus:outline-none focus-visible:border-green focus-visible:ring-3 focus-visible:ring-green/25"
              >
                <span>
                  <span className="block text-base font-bold text-navy sm:text-lg">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {link.description}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-xl text-muted transition-colors group-hover:text-green"
                >
                  →
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <footer className="mt-6 shrink-0 text-center text-xs text-white/45">
        <a href={SITE_URL} className="hover:text-white/80">
          bmzadvogados.adv.br
        </a>
        <span className="mx-2">·</span>
        Belin, Medeiros &amp; Zaiats — Advogados Associados
      </footer>
    </main>
  );
}
