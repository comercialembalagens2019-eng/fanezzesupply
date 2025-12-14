import { Layout } from "@/components/layout/Layout";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
const Contato = () => {
  return <Layout>
      {/* Hero */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-beige mb-4">
              Fale Conosco
            </h1>
            <p className="text-lg text-beige/80">
              Estamos prontos para atender sua empresa. Entre em contato e solicite um orçamento.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Informações de Contato
            </h2>
            <p className="text-muted-foreground text-lg">
              Tire suas dúvidas, solicite orçamentos ou agende uma visita com nossos consultores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Telefone */}
            <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">Telefone</h3>
              <p className="text-muted-foreground">(11) 3456-7890</p>
            </div>

            {/* WhatsApp */}
            <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">WhatsApp</h3>
              <p className="text-muted-foreground mb-2">+55 (47) 99149-0027</p>
              <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="">
                ​
              </a>
            </div>

            {/* E-mail */}
            <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">E-mail</h3>
              <p className="text-muted-foreground break-all">fanezzesupply@gmail.com</p>
            </div>

            {/* Endereço */}
            <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">Endereço</h3>
              <p className="text-muted-foreground">
                Avenida Antonio Ramos Alvin, 1084<br />
                Joinville/SC
              </p>
            </div>

            {/* Horário */}
            <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 md:col-span-2 lg:col-span-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">Horário de Atendimento</h3>
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-muted-foreground">
                <span>Segunda a Sexta: 08h às 18h</span>
                <span>Sábado: 08h às 12h</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>;
};
export default Contato;