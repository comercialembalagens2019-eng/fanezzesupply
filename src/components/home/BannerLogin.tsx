import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function BannerLogin() {
  const { user } = useAuth();
  const [hideBanner, setHideBanner] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(false);

  useEffect(() => {
    if (user) {
      // Espera 300ms antes de iniciar a animação
      setTimeout(() => setPlayAnimation(true), 300);

      // Esconde definitivamente após a animação
      setTimeout(() => setHideBanner(true), 2000);
    }
  }, [user]);

  if (hideBanner || user) return null;

  return (
    <div
      className="relative overflow-hidden h-16 mb-5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl mx-4 md:mx-8"
      style={{
        opacity: playAnimation ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}
    >
      {/* Caminhão animado */}
      <div
        className="absolute top-1/2 -translate-y-1/2 text-3xl pointer-events-none"
        style={{
          left: playAnimation ? "120%" : "-20%",
          transition: "left 1.5s ease-out",
        }}
      >
        🚚
      </div>

      {/* Texto do banner */}
      <Link 
        to="/cadastro"
        className="flex items-center justify-center h-full text-lg md:text-xl font-bold text-primary hover:text-primary/80 transition-colors"
      >
        Cadastre-se e comece a comprar →
      </Link>
    </div>
  );
}
