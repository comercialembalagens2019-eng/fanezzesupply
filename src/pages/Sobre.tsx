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
        title="Sobre a FNZ Supply — Distribuição de Embalagens"
        description="Conheça a FNZ Supply: 40+ anos de mercado, 500+ clientes ativos. Missão, visão e valores de uma distribuidora de embalagens em Joinville/SC."
        path="/sobre"
      />
      <section className="container-custom pt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full bg-navy-light/60" aria-hidden="true" />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">Joinville/SC</span>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-[1.08] text-primary-foreground">Sobre a FNZ Supply</h1>
            <p className="mt-4 text-white/75 max-w-lg">
              Há mais de 40 anos no mercado, somos especialistas em distribuição de embalagens para empresas de todos os portes.
            </p>
          </div>
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={i === 0 ? "rounded-3xl bg-beige p-6 flex flex-col justify-end" : "tile p-6 flex flex-col justify-end"}>
              <p className="text-3xl md:text-4xl font-extrabold tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-custom mt-4 grid gap-4 lg:grid-cols-12">
        <article className="lg:col-span-7 tile p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-5">Nossa história</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              A FNZ Supply nasceu da necessidade de oferecer um serviço diferenciado no mercado de embalagens. Fundada em Joinville, começamos atendendo pequenos comerciantes locais e, ao longo de mais de 40 anos, expandimos nossa atuação para atender empresas de diversos segmentos.
            </p>
            <p>
              Nossa trajetória foi construída com base em valores sólidos: compromisso com a qualidade, condições diferenciadas e um atendimento personalizado que entende as necessidades específicas de cada cliente.
            </p>
            <p>
              Hoje, contamos com uma ampla variedade de produtos, desde plásticos e papéis até itens de limpeza, sempre mantendo o foco em oferecer as melhores soluções para embalagem e proteção de produtos.
            </p>
          </div>
        </article>
        <div className="lg:col-span-5 grid sm:grid-cols-2 gap-4">
          {values.map((value) => (
            <div key={value.title} className="tile p-6">
              <span className="w-11 h-11 rounded-xl bg-primary text-beige grid place-items-center">
                <value.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-extrabold text-lg">{value.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Sobre;
