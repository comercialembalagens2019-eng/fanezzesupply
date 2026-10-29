import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";

// Home loads eagerly; every other page is split into its own chunk.
const Produtos = lazy(() => import("./pages/Produtos"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Contato = lazy(() => import("./pages/Contato"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Admin = lazy(() => import("./pages/Admin"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const ValidarCodigo = lazy(() => import("./pages/ValidarCodigo"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));

const PageFallback = PageSkeleton;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/validar-codigo" element={<ValidarCodigo />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/clientes" element={<Navigate to="/admin" replace />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
