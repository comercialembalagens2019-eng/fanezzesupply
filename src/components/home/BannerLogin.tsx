import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function BannerLogin() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden h-16 mb-5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl mx-4 md:mx-8">
      {/* Texto do banner */}
      <Link 
        to={user ? "/produtos" : "/cadastro"}
        className="flex items-center justify-center h-full text-lg md:text-xl font-bold text-primary hover:text-primary/80 transition-colors"
      >
        {user ? "Comece a comprar →" : "Cadastre-se e comece a comprar →"}
      </Link>
    </div>
  );
}
