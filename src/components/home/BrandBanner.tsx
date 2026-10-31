import { ArrowRight } from "lucide-react";
import marcaImg from "@/assets/home-marca.webp";
import { whatsappWith } from "@/lib/company";

// Custom-printed envelopes are quoted on WhatsApp (minimum 2.000 un., 30 days).
export function BrandBanner() {
  return (
    <section id="personalizados" aria-labelledby="brand-heading" className="container-custom pt-14 scroll-mt-28">
      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-center gap-6 lg:gap-10 rounded-xl bg-navy-dark text-white p-[18px]">
        <div className="relative aspect-[1.6] rounded-md overflow-hidden">
          <img src={marcaImg} alt="" loading="lazy" width={1000} height={717} className="absolute inset-0 w-full h-full object-cover object-[40%_55%]" />
          {/* Printed on the envelope to show the idea; not a real client's logo. */}
          <span aria-hidden="true" className="absolute left-[44%] top-[40%] -translate-x-1/2 -translate-y-1/2 -rotate-[17deg] -skew-x-6 text-navy-dark font-extrabold text-[clamp(22px,3vw,40px)] leading-[0.95] tracking-tight opacity-90 mix-blend-multiply">
            SUA<br />MARCA
            <span className="block w-[72%] h-1.5 mt-2 rounded-full bg-sun mix-blend-normal" />
          </span>
          <small className="absolute left-3.5 bottom-3 text-[13px] font-semibold text-navy-dark bg-white/85 px-2 py-0.5 rounded">Exemplo ilustrativo</small>
        </div>
        <div className="px-4 pb-6 lg:p-0 lg:pr-8">
          <h2 id="brand-heading" className="text-[34px] md:text-[52px] font-extrabold tracking-[-0.045em] leading-[1.02] text-white">Sua marca acompanha cada pedido.</h2>
          <p className="mt-4 mb-7 text-lg text-white/85">Envelopes personalizados sob orçamento, a partir de 2.000 unidades e produção em 30 dias.</p>
          <a
            href={whatsappWith("Olá! Quero um orçamento de envelope personalizado.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 min-h-12 px-6 rounded-md bg-sun text-navy-dark font-bold hover:brightness-105 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          >
            Criar meu personalizado <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
