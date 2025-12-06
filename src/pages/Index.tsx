import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CTASection } from "@/components/home/CTASection";
import { Suspense, lazy } from "react";

const CardboardBox3D = lazy(() => import("@/components/3d/CardboardBox"));

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <Suspense fallback={
        <div className="min-h-[80vh] bg-gradient-to-b from-background via-secondary/30 to-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando animação 3D...</p>
          </div>
        </div>
      }>
        <CardboardBox3D />
      </Suspense>
      <FeaturesSection />
      <FeaturedProducts />
      <CTASection />
    </Layout>
  );
};

export default Index;
