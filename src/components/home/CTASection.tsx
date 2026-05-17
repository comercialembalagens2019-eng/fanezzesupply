import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Condições exclusivas para atacado",
  "Nota fiscal eletrônica em todas as compras",
  "Condições especiais de pagamento",
  "Atendimento personalizado",
];

export function CTASection() {
  return (
    <section className="section-padding bg-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-beige blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-beige blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-beige mb-6">
            Pronto para economizar nas suas embalagens?
          </h2>
          <p className="text-lg md:text-xl text-beige/80 mb-8">
            Cadastre sua empresa agora e tenha acesso a condições exclusivas para atacado.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-beige/10 border border-beige/20"
              >
                <CheckCircle2 className="w-4 h-4 text-beige" />
                <span className="text-sm text-beige">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                Cadastrar minha empresa
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contato">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                Falar com um consultor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
