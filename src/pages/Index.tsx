import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HomeHero } from "@/components/home/HomeHero";
import { QuickBuy } from "@/components/home/QuickBuy";
import { EnvelopeCards } from "@/components/home/EnvelopeCards";
import { SizeGuide } from "@/components/home/SizeGuide";
import { BrandBanner } from "@/components/home/BrandBanner";
import { HelpCards } from "@/components/home/HelpCards";
import { FAQ } from "@/components/home/FAQ";

const Index = () => {
  const { hash } = useLocation();
  // Header links such as "/#guia-de-tamanhos" arrive from other pages; scroll once the sections exist.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  return (
    <Layout>
      <SEO
        title="FNZ Supply — Distribuição de Embalagens B2B em Joinville/SC"
        description="Distribuidora B2B de envelopes de segurança. Preço por faixa de quantidade, nota fiscal e frete grátis em Joinville/SC."
        path="/"
      />
      <HomeHero />
      <QuickBuy />
      <EnvelopeCards />
      <div className="container-custom">
        <SizeGuide />
      </div>
      <BrandBanner />
      <HelpCards />
      <div className="container-custom">
        <FAQ />
      </div>
    </Layout>
  );
};

export default Index;
