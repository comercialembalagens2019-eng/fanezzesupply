import { Link } from "react-router-dom";
import { ArrowRight, FileText, MessageCircle, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PriceCalculator } from "./PriceCalculator";

const WHATSAPP_URL = "https://wa.me/5547991490027";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="container-custom pt-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
      {/* Main tile */}
      <div className="md:col-span-6 lg:col-span-7 lg:row-span-2 rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-navy-light/60" aria-hidden="true" />
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

      <div className="md:col-span-3 lg:col-span-5">
        <PriceCalculator />
      </div>

      <div className="md:col-span-3 lg:col-span-3 rounded-3xl bg-beige p-6 flex flex-col justify-between min-h-[150px]">
        <Truck className="w-7 h-7" aria-hidden="true" />
        <div>
          <b className="text-lg font-extrabold block">Frete grátis</b>
          <span className="text-sm text-navy/75">em Joinville · demais R$ 19,90</span>
        </div>
      </div>
      <div className="md:col-span-6 lg:col-span-2 tile p-6 flex flex-col justify-between min-h-[150px]">
        <FileText className="w-7 h-7" aria-hidden="true" />
        <div>
          <b className="text-lg font-extrabold block">NF-e</b>
          <span className="text-sm text-muted-foreground">em todo pedido</span>
        </div>
      </div>
    </section>
  );
}
