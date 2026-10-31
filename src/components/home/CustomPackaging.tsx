import { ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import { whatsappWith } from "@/lib/company";

const custom = products.find((p) => p.id === "envelope-personalizado")!;
const quoteUrl = whatsappWith("Olá! Gostaria de um orçamento de envelope personalizado com a minha logomarca.");

export function CustomPackaging() {
  return (
    <section aria-labelledby="custom-heading" className="mt-10 md:mt-16 rounded-3xl bg-beige-light grid md:grid-cols-[1fr_280px] gap-6 p-6 md:p-10 items-center">
      <div>
        <h2 id="custom-heading" className="text-2xl md:text-3xl font-extrabold">Envelope com a sua logomarca</h2>
        <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">Sob orçamento: produção em 30 dias, a partir de {custom.minOrder.toLocaleString("pt-BR")} unidades. A FNZ é fabricante e distribuidora.</p>
        <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-3.5 rounded-xl mt-5 hover:bg-navy-light focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Pedir orçamento <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
      <figure className="min-w-0">
        <img src={custom.image} alt="Envelope de segurança sem impressão" loading="lazy" width={1200} height={900} className="w-full aspect-[4/3] object-cover rounded-2xl" />
        <figcaption className="text-xs text-muted-foreground mt-2 leading-relaxed">Imagem ilustrativa — personalização sob orçamento.</figcaption>
      </figure>
    </section>
  );
}
