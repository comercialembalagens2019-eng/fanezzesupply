import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  contentWidth?: "default" | "wide";
}

export function Layout({ children, contentWidth = "default" }: LayoutProps) {
  // Keyed by route so each page fades in once on navigation (not on every re-render).
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main key={pathname} className="flex-1 pt-28 sm:pt-16 animate-enter">
        {contentWidth === "wide" ? <div className="container-wide">{children}</div> : children}
      </main>
      <Footer />
    </div>
  );
}
