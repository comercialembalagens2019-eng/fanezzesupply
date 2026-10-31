import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HomePurchaseSection } from "@/components/home/HomePurchaseSection";
import { QuickOrder } from "@/components/home/QuickOrder";
import { CustomPackaging } from "@/components/home/CustomPackaging";
import { SizeGuide } from "@/components/home/SizeGuide";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FAQ } from "@/components/home/FAQ";
import { SideGuides } from "@/components/home/SideGuides";

const Index = () => {
  return (
    <Layout contentWidth="wide">
      <SEO
        title="FNZ Supply — Distribuição de Embalagens B2B em Joinville/SC"
        description="Distribuidora B2B de envelopes de segurança. Preço por faixa de quantidade, nota fiscal e frete grátis em Joinville/SC."
        path="/"
      />
      <div className="relative">
        <SideGuides />
        <HomePurchaseSection />
        <SizeGuide />
        <QuickOrder />
        <CustomPackaging />
        <HowItWorks />
        <FAQ />
      </div>
    </Layout>
  );
};

export default Index;
