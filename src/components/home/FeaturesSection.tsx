import { Package, FileText, TrendingDown, CreditCard } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Pedidos mínimos acessíveis",
    description: "Trabalhamos com quantidades mínimas adequadas para empresas de todos os portes.",
  },
  {
    icon: FileText,
    title: "Nota fiscal eletrônica",
    description: "Emitimos NF-e para todas as vendas, garantindo a regularidade fiscal da sua empresa.",
  },
  {
    icon: TrendingDown,
    title: "Preços competitivos para atacado",
    description: "Condições especiais para compras em quantidade. Quanto mais você compra, mais economiza.",
  },
  {
    icon: CreditCard,
    title: "Análise de crédito facilitada",
    description: "Processo ágil para liberação de crédito e condições de pagamento especiais.",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que escolher a{" "}
            <span className="text-primary">Fanezze Supply?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Somos especialistas em distribuição de embalagens para empresas, com foco em qualidade e atendimento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
