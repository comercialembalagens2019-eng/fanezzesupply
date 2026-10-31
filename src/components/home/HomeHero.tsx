import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/home-hero.webp";

// Full-width photo with the title on the blue wall; the quick buy bar overlaps its bottom edge.
export function HomeHero() {
  return (
    <section aria-labelledby="home-heading" className="relative overflow-hidden bg-wall text-white">
      <img
        src={heroImg}
        alt="Envelopes de segurança FNZ: um branco com uma camiseta dentro e um cinza"
        width={1546}
        height={1017}
        fetchPriority="high"
        className="absolute inset-x-0 bottom-0 w-full h-full object-cover object-bottom"
      />
      <div className="relative container-custom text-center pt-10 md:pt-12 pb-40 min-h-[600px] md:min-h-[clamp(640px,54vw,820px)]">
        <h1 id="home-heading" className="text-[44px] sm:text-6xl lg:text-[80px] font-extrabold leading-none tracking-[-0.045em] text-white">
          <span className="block animate-enter">Pequenos detalhes.</span>
          <span className="block animate-enter">Grandes envios.</span>
        </h1>
        <p className="mt-4 text-lg md:text-[22px] font-medium animate-enter [--enter-delay:70ms]">
          Envelopes para a rotina de quem vende e envia.
        </p>
        <a
          href="#envelopes"
          className="mt-7 inline-flex w-full sm:w-auto justify-center items-center gap-2.5 min-h-[54px] px-8 rounded-md bg-sun text-navy-dark font-bold text-[17px] hover:brightness-105 transition animate-enter [--enter-delay:140ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          Encontrar minha embalagem <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
