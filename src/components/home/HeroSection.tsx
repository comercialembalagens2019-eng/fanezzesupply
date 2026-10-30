import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PriceCalculator } from "./PriceCalculator";
import { WHATSAPP_URL } from "@/lib/company";
import { products } from "@/data/products";
import { formatBRL, fromPrice } from "@/lib/pricing";

// Product shown in the banner; its photo and starting price come from the catalog.
const spotlight = products.find((p) => p.id === "envelope-cinza")!;

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="container-custom pt-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
      {/* Main tile */}
      <div className="md:col-span-6 lg:col-span-8 rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-navy-light/60" aria-hidden="true" />
        {/* Real product in the banner, linking straight to it */}
        <Link
          to={`/produtos?produto=${encodeURIComponent(spotlight.id)}`}
          className="hidden md:block absolute right-8 bottom-8 w-48 rounded-2xl bg-white text-navy p-2 shadow-xl shadow-black/20 rotate-2 hover:rotate-0 hover:-translate-y-0.5 transition-transform duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img src={spotlight.image} alt="" width={1200} height={900} className="w-full aspect-[4/3] object-cover rounded-xl" />
          <span className="block px-1.5 pt-2 pb-1">
            <span className="block text-sm font-extrabold">{spotlight.name}</span>
            <span className="block text-xs text-navy/70">a partir de {formatBRL(fromPrice(spotlight))}/un.</span>
          </span>
        </Link>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">
            Atacado B2B · Joinville/SC
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-[1.08] tracking-tight max-w-lg text-primary-foreground">
            Reponha seu estoque de embalagens em 2 minutos.
          </h1>
          <p className="mt-4 text-white/75 max-w-md">
            Preço por faixa de quantidade, nota fiscal e pagamento por PIX, boleto ou cartão.
          </p>
        </div>
        <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to={user ? "/produtos" : "/cadastro"}
            className="inline-flex justify-center items-center gap-2 bg-beige text-navy font-bold px-6 py-3.5 rounded-xl hover:bg-beige-light transition-colors"
          >
            {user ? "Fazer pedido" : "Cadastrar e comprar"} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center items-center gap-2 bg-white/10 font-semibold px-6 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="md:col-span-6 lg:col-span-4">
        <PriceCalculator />
      </div>

    </section>
  );
}
