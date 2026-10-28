import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { EnvelopeBanner } from "@/components/home/EnvelopeBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { QuickOrder } from "@/components/home/QuickOrder";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="FNZ Supply — Distribuição de Embalagens B2B em Joinville/SC"
        description="Distribuidora B2B de envelopes de segurança e filme stretch. Preço por faixa de quantidade, nota fiscal e frete grátis em Joinville/SC."
        path="/"
      />
      <HeroSection />
      <FeaturedProducts />
      <QuickOrder />
      <CTASection />
      <EnvelopeBanner />
    </Layout>
  );
};

export default Index;
