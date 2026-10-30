import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { QuickOrder } from "@/components/home/QuickOrder";
import { CTASection } from "@/components/home/CTASection";
import { Differentials } from "@/components/home/Differentials";
import { SizeGuide } from "@/components/home/SizeGuide";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FAQ } from "@/components/home/FAQ";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="FNZ Supply — Distribuição de Embalagens B2B em Joinville/SC"
        description="Distribuidora B2B de envelopes de segurança. Preço por faixa de quantidade, nota fiscal e frete grátis em Joinville/SC."
        path="/"
      />
      <HeroSection />
      <Differentials />
      <FeaturedProducts />
      <SizeGuide />
      <HowItWorks />
      <QuickOrder />
      <CTASection />
      <FAQ />
    </Layout>
  );
};

export default Index;
