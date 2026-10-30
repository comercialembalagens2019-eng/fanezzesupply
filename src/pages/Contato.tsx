import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { ArrowRight, Clock, ExternalLink, Mail, MapPin, MessageCircle, Package } from "lucide-react";
import { COMPANY, MAPS_URL, WHATSAPP_URL, whatsappWith } from "@/lib/company";

const QUOTE_URL = whatsappWith("Olá! Gostaria de um orçamento de embalagens para a minha empresa.");

const channels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: COMPANY.phone,
    hint: "Orçamentos, dúvidas e pedidos",
    href: WHATSAPP_URL,
    action: "Abrir conversa",
    external: true,
  },
  {
    icon: Mail,
    label: "E-mail",
    value: COMPANY.email,
    hint: "Comercial e financeiro",
    href: `mailto:${COMPANY.email}`,
    action: "Enviar e-mail",
    external: false,
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: COMPANY.shortAddress,
    hint: "2º andar, sala 3 · CEP 89211-460",
    href: MAPS_URL,
    action: "Ver no mapa",
    external: true,
  },
];

const Contato = () => {
  return (
    <Layout>
      <SEO
        title="Contato — FNZ Supply"
        description="Fale com a FNZ Supply pelo WhatsApp ou e-mail. Orçamentos de embalagens para empresas, atendimento 24h. Joinville/SC."
        path="/contato"
      />

      <section className="container-custom pt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-navy-light/60" aria-hidden="true" />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">Atendimento B2B</span>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-[1.08] text-primary-foreground">Fale conosco</h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg">
              Estamos prontos para ajudar sua empresa a encontrar as melhores soluções em embalagens.
            </p>
            <p className="mt-2 text-white/70 max-w-lg">
              Precisa de um orçamento, tem dúvidas sobre os produtos ou quer conhecer nossas condições comerciais? Chame a gente.
            </p>
          </div>
          <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center gap-2 bg-beige text-navy font-bold px-6 py-3.5 rounded-xl hover:bg-beige-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> Conversar no WhatsApp
            </a>
            <Link
              to="/produtos"
              className="inline-flex justify-center items-center gap-2 bg-white/10 font-semibold px-6 py-3.5 rounded-xl hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ver produtos <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 grid gap-4">
          <div className="tile p-6 flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-success-soft text-success grid place-items-center shrink-0">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>
              <span className="text-sm text-muted-foreground block">Horário</span>
              <b className="text-lg font-extrabold">{COMPANY.hours}</b>
              <span className="text-sm text-muted-foreground block">Pelo WhatsApp e pelo site, todos os dias.</span>
            </span>
          </div>
          <div className="rounded-3xl bg-beige p-6 md:p-7 flex flex-col justify-between gap-5">
            <div>
              <Package className="w-6 h-6 text-navy" aria-hidden="true" />
              <h2 className="mt-3 text-xl font-extrabold text-navy">Sua empresa compra embalagens em quantidade?</h2>
              <p className="mt-1 text-navy/75">Consulte nossas condições para pedidos de atacado e envelopes personalizados.</p>
            </div>
            <a
              href={QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 bg-navy text-white font-bold px-5 py-3 rounded-xl hover:bg-navy-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Solicitar orçamento <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="container-custom mt-4" aria-labelledby="canais">
        <h2 id="canais" className="sr-only">Canais de atendimento</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {channels.map((channel) => (
            <li key={channel.label}>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group tile p-6 h-full flex flex-col gap-4 hover:shadow-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-12 h-12 rounded-xl bg-muted grid place-items-center">
                  <channel.icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground block">{channel.label}</span>
                  <b className="text-lg font-extrabold block break-words">{channel.value}</b>
                  <span className="text-sm text-muted-foreground block">{channel.hint}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {channel.action}
                  {channel.external ? (
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
};

export default Contato;
