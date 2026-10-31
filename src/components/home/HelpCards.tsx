import { ArrowRight } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/company";

const buttonClass =
  "inline-flex items-center gap-2.5 min-h-12 px-5 rounded-md border-[1.5px] border-primary bg-card font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function SizesArt() {
  return (
    <svg viewBox="0 0 190 120" className="w-full max-w-[190px] h-auto" aria-hidden="true">
      <circle cx="120" cy="34" r="22" className="fill-sun-soft" />
      <rect x="8" y="30" width="12" height="82" rx="2" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <path d="M8 42h6M8 54h4M8 66h6M8 78h4M8 90h6M8 102h4" stroke="currentColor" strokeWidth="2" />
      <rect x="34" y="14" width="80" height="62" rx="2" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <path d="M34 22h80" stroke="currentColor" strokeWidth="2" />
      <path d="M46 40h56M46 50h40" stroke="#c8d3e4" strokeWidth="2" strokeDasharray="4 4" />
      <rect x="70" y="44" width="104" height="70" rx="2" fill="#fff" stroke="currentColor" strokeWidth="2" transform="rotate(-4 122 79)" />
      <path d="M70 54l104-7" stroke="currentColor" strokeWidth="2" />
      <path d="M84 84l70-5" stroke="#c8d3e4" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
}

function ChatArt() {
  return (
    <svg viewBox="0 0 190 120" className="w-full max-w-[190px] h-auto" aria-hidden="true">
      <circle cx="54" cy="74" r="34" className="fill-sun" opacity="0.55" />
      <rect x="78" y="40" width="76" height="72" rx="2" fill="#fff" stroke="currentColor" strokeWidth="2" transform="rotate(8 116 76)" />
      <path d="M82 48l74 10" stroke="currentColor" strokeWidth="2" />
      <path d="M28 10h62a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H56l-14 12V56H28a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <circle cx="45" cy="33" r="3.5" fill="currentColor" />
      <circle cx="59" cy="33" r="3.5" fill="currentColor" />
      <circle cx="73" cy="33" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function HelpCards() {
  return (
    <section id="ajuda" aria-label="Ajuda para escolher" className="container-custom pt-4 scroll-mt-28">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-3 shadow-[0_1px_2px_rgb(15_42_95/0.06),0_10px_30px_-14px_rgb(15_42_95/0.22)]">
          <div className="h-full rounded-md px-5 py-6 sm:px-7 grid sm:grid-cols-[190px_minmax(0,1fr)] gap-6 sm:gap-7 items-center text-primary">
            <SizesArt />
            <div>
              <h3 className="text-2xl font-extrabold tracking-[-0.035em] leading-tight">Qual tamanho escolher?</h3>
              <p className="mt-1.5 mb-[18px] text-muted-foreground">Confira nosso guia de medidas.</p>
              <a href="#guia-de-tamanhos" className={buttonClass}>Abrir guia de medidas <ArrowRight className="w-5 h-5 text-sun" aria-hidden="true" /></a>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-3 shadow-[0_1px_2px_rgb(15_42_95/0.06),0_10px_30px_-14px_rgb(15_42_95/0.22)]">
          <div className="h-full rounded-md bg-sun-soft px-5 py-6 sm:px-7 grid sm:grid-cols-[190px_minmax(0,1fr)] gap-6 sm:gap-7 items-center text-primary">
            <ChatArt />
            <div>
              <h3 className="text-2xl font-extrabold tracking-[-0.035em] leading-tight">Vamos encontrar sua embalagem?</h3>
              <p className="mt-1.5 mb-[18px] text-muted-foreground">Tire suas dúvidas e fale com a FNZ.</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={buttonClass}>Falar com a FNZ <ArrowRight className="w-5 h-5 text-sun" aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
