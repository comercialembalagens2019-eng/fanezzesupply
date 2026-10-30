import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { ArrowRight, Award, MessageCircle, Target, TrendingUp, Users } from "lucide-react";
import envelopeImg from "@/assets/envelope.webp";
import { WHATSAPP_URL } from "@/lib/company";

// Only figures the company has confirmed are shown here.
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
        description="Conheça a FNZ Supply: mais de 40 anos no mercado de embalagens. Missão, visão e valores de uma distribuidora de embalagens em Joinville/SC."
        path="/sobre"
      />

      {/* Hero: text on the left, real product photo on the right */}
      <section className="container-custom pt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full bg-navy-light/60" aria-hidden="true" />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">Joinville/SC</span>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-[1.08] text-primary-foreground">Sobre a FNZ Supply</h1>
            <p className="mt-4 text-lg text-white/90 max-w-xl">
              Há mais de 40 anos conectando empresas às melhores soluções em embalagens.
            </p>
            <p className="mt-2 text-white/70 max-w-xl">
              Produtos de qualidade, condições competitivas e atendimento próximo para empresas de diferentes segmentos.
            </p>
          </div>
        </div>
        <figure className="lg:col-span-5 relative rounded-3xl overflow-hidden bg-card ring-1 ring-black/5 min-h-[280px]">
          <img src={envelopeImg} alt="Envelope de segurança FNZ Supply" className="absolute inset-0 w-full h-full object-cover" />
          <figcaption className="absolute left-4 bottom-4 rounded-2xl bg-beige px-5 py-4 shadow-sm">
            <span className="block text-3xl font-extrabold text-navy tabular-nums leading-none">40+</span>
            <span className="block text-sm font-semibold text-navy/80 mt-1">anos de mercado</span>
          </figcaption>
        </figure>
      </section>

      {/* Story */}
      <section className="container-custom mt-4">
        <article className="tile p-8 md:p-12 grid gap-8 lg:grid-cols-12">
          <header className="lg:col-span-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nossa história</span>
            <h2 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
              De Joinville para empresas de diversos segmentos.
            </h2>
          </header>
          <div className="lg:col-span-8 space-y-4 text-muted-foreground leading-relaxed max-w-2xl">
            <p>
              A FNZ Supply nasceu da necessidade de oferecer um serviço diferenciado no mercado de embalagens. Fundada em Joinville, começamos atendendo pequenos comerciantes locais.
            </p>
            <p>
              Ao longo de mais de 40 anos, expandimos nossa atuação com base em valores sólidos: compromisso com a qualidade, condições diferenciadas e atendimento personalizado.
            </p>
            <p>
              Hoje contamos com uma ampla variedade de produtos, desde plásticos e papéis até itens de limpeza, sempre com foco nas melhores soluções para embalagem e proteção de produtos.
            </p>
          </div>
        </article>
      </section>

      {/* Mission, vision, values */}
      <section className="container-custom mt-4" aria-labelledby="valores">
        <h2 id="valores" className="sr-only">Missão, visão e valores</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <li key={value.title} className="tile p-6">
              <span className="w-11 h-11 rounded-xl bg-primary text-beige grid place-items-center">
                <value.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-extrabold text-lg">{value.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{value.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="container-custom mt-4">
        <div className="rounded-3xl bg-beige p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy">Precisando de embalagens para sua empresa?</h2>
            <p className="mt-2 text-navy/75">Conheça o catálogo e encontre a solução ideal para a sua operação.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/produtos"
              className="inline-flex justify-center items-center gap-2 bg-navy text-white font-bold px-6 py-3.5 rounded-xl hover:bg-navy-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ver produtos <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center gap-2 bg-white text-navy font-semibold px-6 py-3.5 rounded-xl ring-1 ring-navy/10 hover:bg-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> Falar com um consultor
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Sobre;
