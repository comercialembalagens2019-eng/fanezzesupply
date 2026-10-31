import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import envelopeImg from "@/assets/home-envelope.webp";
import coexImg from "@/assets/home-coex.webp";
import cinzaImg from "@/assets/home-cinza.webp";

const cards = [
  { id: "envelope", name: "Envelope", text: "Preto ou branco.", image: envelopeImg, alt: "Envelope de segurança branco com uma camiseta dentro" },
  { id: "envelope-coex", name: "Envelope COEX", text: "Branco por fora, cinza por dentro.", image: coexImg, alt: "Envelope COEX aberto com uma camiseta dentro" },
  { id: "envelope-cinza", name: "Envelope Cinza", text: "Acabamento cinza.", image: cinzaImg, alt: "Envelope de segurança cinza" },
];

export function EnvelopeCards() {
  return (
    <section id="envelopes" aria-labelledby="envelopes-heading" className="container-custom pt-20 md:pt-24 scroll-mt-28">
      <div className="text-center mb-8">
        <h2 id="envelopes-heading" className="text-[32px] md:text-5xl font-extrabold tracking-[-0.045em] leading-tight">Encontre seu envelope</h2>
        <p className="mt-2 text-lg md:text-[19px] text-muted-foreground">Três opções para diferentes necessidades.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.id} className="group rounded-xl bg-card p-3.5 pb-6 flex flex-col shadow-[0_1px_2px_rgb(15_42_95/0.06),0_10px_30px_-14px_rgb(15_42_95/0.22)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
            <div className="aspect-[1.1] rounded-md overflow-hidden">
              <img src={c.image} alt={c.alt} loading="lazy" width={700} height={525} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100" />
            </div>
            <h3 className="mt-[18px] mx-2 text-2xl font-extrabold tracking-[-0.035em]">{c.name}</h3>
            <p className="mx-2 mb-5 text-[17px] text-muted-foreground">{c.text}</p>
            <Link
              to={`/produtos?produto=${encodeURIComponent(c.id)}`}
              aria-label={`Ver opções de ${c.name}`}
              className="mt-auto mx-2 inline-flex items-center justify-center gap-2.5 min-h-12 rounded-md border-[1.5px] border-primary bg-card font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ver opções <ArrowRight className="w-5 h-5 text-sun" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
