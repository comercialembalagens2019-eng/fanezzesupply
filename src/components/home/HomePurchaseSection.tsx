import { useLayoutEffect, useRef, useState } from "react";
import { HeroSection } from "./HeroSection";
import { PriceCalculator } from "./PriceCalculator";
import { Differentials } from "./Differentials";
import { FeaturedProducts } from "./FeaturedProducts";

// Keep this breakpoint equal to the .home-purchase-grid media query in index.css.
const DESKTOP_QUERY = "(min-width: 1280px)";

export function HomePurchaseSection() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const grid = useRef<HTMLDivElement>(null);
  const focusedBeforeMove = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const change = () => {
      const focused = document.activeElement;
      focusedBeforeMove.current = focused instanceof HTMLElement && grid.current?.contains(focused) ? focused : null;
      setDesktop(media.matches);
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useLayoutEffect(() => {
    const focused = focusedBeforeMove.current;
    focusedBeforeMove.current = null;
    if (!focused?.isConnected) return;
    if (document.activeElement !== focused) focused.focus({ preventScroll: true });
    const bounds = focused.getBoundingClientRect();
    const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    if (bounds.top < headerBottom + 16 || bounds.bottom > window.innerHeight) {
      focused.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [desktop]);

  // Stable keys, type and parent preserve the actual nodes and local state.
  // Reordering this list also changes keyboard order, without CSS order/tabindex.
  const modules = {
    banner: <div key="banner" className="home-banner"><HeroSection /></div>,
    calculator: <section key="calculator" className="home-calculator" aria-label="Calculadora de preço"><PriceCalculator /></section>,
    differentials: <div key="differentials" className="home-differentials"><Differentials /></div>,
    materials: <div key="materials" className="home-materials"><FeaturedProducts /></div>,
  };
  const order = desktop
    ? [modules.banner, modules.calculator, modules.differentials, modules.materials]
    : [modules.banner, modules.differentials, modules.materials, modules.calculator];

  return <div ref={grid} className="home-purchase-grid">{order}</div>;
}
