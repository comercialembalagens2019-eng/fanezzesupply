import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatBRL, SHIPPING_FEE } from "@/lib/pricing";
import { WHATSAPP_URL } from "@/lib/company";

// Answers reflect what the site actually charges and offers; no delivery promise for ready stock.
const faq = [
  {
    q: "Qual a quantidade mínima?",
    a: "Envelope COEX e Envelope Cinza: a partir de 500 unidades por tamanho. Envelope preto ou branco e envelope personalizado: a partir de 2.000 unidades.",
  },
  {
    q: "Como funciona o preço por quantidade?",
    a: "No Envelope COEX e no Envelope Cinza, cada tamanho tem faixas de preço: a partir de 1.000 unidades o valor por unidade fica menor. A calculadora mostra o total antes de você comprar.",
  },
  {
    q: "Quanto custa o frete?",
    a: `Frete grátis para Joinville/SC. Para as demais localidades, ${formatBRL(SHIPPING_FEE)} por pedido.`,
  },
  {
    q: "Os pedidos têm nota fiscal?",
    a: "Sim. Todo pedido sai com NF-e emitida para o CNPJ da sua empresa.",
  },
  {
    q: "Vocês fazem envelope personalizado?",
    a: "Sim. Produzimos envelopes com a sua logomarca a partir de 2.000 unidades, com prazo de produção de 30 dias. Peça um orçamento pelo WhatsApp.",
  },
  {
    q: "Quais as formas de pagamento?",
    a: "Pix (aprovação imediata), boleto (vence em 3 dias) e cartão de crédito à vista (Visa e Mastercard).",
  },
  {
    q: "Qual o prazo de entrega?",
    a: "Depende do endereço de entrega. Fale com a gente pelo WhatsApp para saber o prazo para a sua cidade. O envelope personalizado tem produção de 30 dias.",
  },
];

export function FAQ() {
  return (
    <section className="mt-10 md:mt-16 mb-12 md:mb-16" aria-labelledby="faq-heading">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="faq-heading" className="text-2xl md:text-3xl font-extrabold">Perguntas frequentes</h2>
          <p className="text-muted-foreground mt-2">
            Não achou o que procura?{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline underline-offset-4">
              Fale no WhatsApp
            </a>
            .
          </p>
        </div>
        <Accordion type="single" collapsible className="lg:col-span-8 tile px-5 sm:px-6">
          {faq.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="last:border-b-0">
              <AccordionTrigger className="text-left font-bold text-base hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
