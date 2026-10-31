import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Keyed by route so each page fades in once on navigation (not on every re-render).
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main key={pathname} className="flex-1 pt-[var(--header-height)] animate-enter">
        {children}
      </main>
      <Footer />
    </div>
  );
}
