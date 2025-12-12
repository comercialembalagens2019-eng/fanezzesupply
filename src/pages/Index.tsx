import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CTASection } from "@/components/home/CTASection";
import { BannerLogin } from "@/components/home/BannerLogin";

const Index = () => {
  return (
    <Layout>
      <BannerLogin />
      <HeroSection />
      <FeaturesSection />
      <FeaturedProducts />
      <CTASection />
    </Layout>
  );
};

export default Index;
