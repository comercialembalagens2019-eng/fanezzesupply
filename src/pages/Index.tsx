import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="FNZ Supply — Distribuição de Embalagens B2B em Joinville/SC"
        description="Distribuidora de embalagens para empresas: caixas, fitas, papel kraft e mais. Nota fiscal e entrega. Frete grátis em Joinville/SC."
        path="/"
      />
      <HeroSection />
      <FeaturesSection />
      <FeaturedProducts />
      <CTASection />
    </Layout>
  );
};

export default Index;
