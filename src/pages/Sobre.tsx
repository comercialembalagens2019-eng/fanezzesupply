import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Users, Target, Award, TrendingUp } from "lucide-react";

const stats = [
  { label: "Anos de Mercado", value: "40+" },
  { label: "Clientes Ativos", value: "500+" },
  { label: "Produtos no Catálogo", value: "200+" },
  { label: "Taxa de Satisfação", value: "98%" },
];

const values = [
  {
    icon: Target,
    title: "Missão",
    description: "Fornecer embalagens de qualidade com condições diferenciadas, contribuindo para o sucesso dos nossos clientes.",
  },
  {
    icon: Users,
    title: "Visão",
    description: "Ser referência no mercado de distribuição de embalagens, reconhecidos pela excelência no atendimento.",
  },
  {
    icon: Award,
    title: "Valores",
    description: "Compromisso, transparência, qualidade e respeito nas relações com clientes, fornecedores e colaboradores.",
  },
  {
    icon: TrendingUp,
    title: "Diferencial",
    description: "Pedidos mínimos acessíveis, condições de pagamento flexíveis e entrega ágil em toda a região.",
  },
];

const Sobre = () => {
  return (
    <Layout>
      <SEO
        title="Sobre a Fanezze Supply — Distribuição de Embalagens"
        description="Conheça a Fanezze Supply: 40+ anos de mercado, 500+ clientes ativos. Missão, visão e valores de uma distribuidora de embalagens em Joinville/SC."
        path="/sobre"
      />
      {/* Hero */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-beige mb-4">
              Sobre a Fanezze Supply
            </h1>
            <p className="text-lg text-beige/80">
              Há mais de 40 anos no mercado, somos especialistas em distribuição de embalagens para empresas de todos os portes.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              Nossa História
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                A Fanezze Supply nasceu da necessidade de oferecer um serviço diferenciado no mercado de embalagens. Fundada em Joinville, começamos atendendo pequenos comerciantes locais e, ao longo de mais de 40 anos, expandimos nossa atuação para atender empresas de diversos segmentos.
              </p>
              <p>
                Nossa trajetória foi construída com base em valores sólidos: compromisso com a qualidade, condições diferenciadas e um atendimento personalizado que entende as necessidades específicas de cada cliente.
              </p>
              <p>
                Hoje, contamos com uma ampla variedade de produtos, desde plásticos e papéis até itens de limpeza, sempre mantendo o foco em oferecer as melhores soluções para embalagem e proteção de produtos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-secondary">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Nossos Pilares
            </h2>
            <p className="text-muted-foreground">
              Os princípios que guiam nossa atuação no mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="bg-card rounded-2xl border border-border p-6 text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary flex items-center justify-center">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Sobre;
