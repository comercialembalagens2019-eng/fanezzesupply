import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5547991490027";

const Contato = () => {
  return (
    <Layout>
      <SEO
        title="Contato — FNZ Supply"
        description="Fale com a FNZ Supply: telefone, WhatsApp, e-mail e localização em Joinville/SC. Solicite seu orçamento de embalagens."
        path="/contato"
      />
      <section className="container-custom pt-4 grid gap-4 md:grid-cols-6 lg:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-7 lg:row-span-2 rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-navy-light/60" aria-hidden="true" />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">Atendimento B2B</span>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-[1.08] text-primary-foreground">Fale conosco</h1>
            <p className="mt-4 text-white/75 max-w-md">
              Tire dúvidas, peça um orçamento de envelope personalizado ou combine um pedido de volume.
            </p>
          </div>
          <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center gap-2 bg-beige text-navy font-bold px-6 py-3.5 rounded-xl hover:bg-beige-light transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> Conversar no WhatsApp
            </a>
            <Link
              to="/produtos"
              className="inline-flex justify-center items-center gap-2 bg-white/10 font-semibold px-6 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
            >
              Ver produtos <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <a href="tel:+554734361602" className="md:col-span-3 lg:col-span-5 tile p-6 flex items-center gap-4 hover:shadow-hover transition-shadow">
          <span className="w-12 h-12 rounded-xl bg-muted grid place-items-center shrink-0"><Phone className="w-5 h-5" aria-hidden="true" /></span>
          <span>
            <span className="text-sm text-muted-foreground block">Telefone</span>
            <b className="text-lg font-extrabold">(47) 3436-1602</b>
          </span>
        </a>
        <a href="mailto:vendas@fnzsupply.com.br" className="md:col-span-3 lg:col-span-5 tile p-6 flex items-center gap-4 hover:shadow-hover transition-shadow">
          <span className="w-12 h-12 rounded-xl bg-muted grid place-items-center shrink-0"><Mail className="w-5 h-5" aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="text-sm text-muted-foreground block">E-mail</span>
            <b className="text-lg font-extrabold break-all">vendas@fnzsupply.com.br</b>
          </span>
        </a>

        <div className="md:col-span-3 lg:col-span-4 rounded-3xl bg-beige p-6">
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
          <b className="mt-4 text-lg font-extrabold block">WhatsApp</b>
          <span className="text-navy/75">(47) 99149-0027</span>
        </div>
        <div className="md:col-span-3 lg:col-span-4 tile p-6">
          <MapPin className="w-6 h-6" aria-hidden="true" />
          <b className="mt-4 text-lg font-extrabold block">Endereço</b>
          <span className="text-muted-foreground">Av. Antonio Ramos Alvin, 1084 · Joinville/SC</span>
        </div>
        <div className="md:col-span-6 lg:col-span-4 tile p-6">
          <Clock className="w-6 h-6" aria-hidden="true" />
          <b className="mt-4 text-lg font-extrabold block">Horário</b>
          <span className="text-muted-foreground">Seg–Sex 8h–18h · Sáb 8h–12h</span>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
