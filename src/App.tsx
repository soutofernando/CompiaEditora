import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ProductCatalog } from "./components/ProductCatalog";
import { EnhancedShoppingCart } from "./components/EnhancedShoppingCart";
import { AdminPanel } from "./components/AdminPanel";
import { OrderHistory } from "./components/OrderHistory";
import { AdminLogin } from "./AdminLogin";
import { toast } from "sonner";

export default function App() {
  const location = useLocation();
  const cartItems = useQuery(api.cart.getCart) || [];
  const cartCount = cartItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const createSampleData = useMutation(api.sampleData.createSampleData);
  const setupFirstUserAsAdmin = useMutation(api.setup.setupFirstUserAsAdmin);

  const isAdminLoginPage = location.pathname === '/admin';

  useEffect(() => {
    const setupUser = async () => {
      try {
        await setupFirstUserAsAdmin();
      } catch (error) {
      }
    };
    setupUser();
  }, [setupFirstUserAsAdmin]);

  if (isAdminLoginPage) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AdminLogin />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-blue-600">COMPIA Editora</h1>
            <Authenticated>
              <nav className="flex gap-6">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Catálogo
                </Link>
                <Link
                  to="/cart"
                  className={`px-3 py-2 rounded-md transition-colors relative ${
                    location.pathname === '/cart' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Carrinho
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/orders"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/orders' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Pedidos
                </Link>
                <Link
                  to="/admin-panel"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/admin-panel' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Admin
                </Link>
              </nav>
            </Authenticated>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Admin Login
            </Link>
            <Authenticated>
             
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Content />} />
          <Route path="/cart" element={<Content />} />
          <Route path="/orders" element={<Content />} />
          <Route path="/admin-panel" element={<Content />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">COMPIA Editora</h3>
              <p className="text-gray-300 text-sm">
                Especializada em materiais bibliográficos de computação e inteligência artificial.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Categorias</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Programação</li>
                <li>Inteligência Artificial</li>
                <li>Cibersegurança</li>
                <li>Blockchain</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Pagamentos</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>💳 PIX - Instantâneo</li>
                <li>💳 Cartão de Crédito</li>
                <li>🏦 Boleto Bancário</li>
                <li>🔒 Pagamento Seguro</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>📧 contato@compia.com.br</p>
                <p>📱 (11) 9999-9999</p>
                <p>📍 São Paulo, SP</p>
                <p>🕒 Seg-Sex: 9h às 18h</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 COMPIA Editora. Todos os direitos reservados.</p>
            <p className="text-xs mt-2">Plataforma de e-commerce desenvolvida com Convex + React</p>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}

function Content() {
  const location = useLocation();
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bem-vindo à COMPIA Editora
            </h2>
            <p className="text-gray-600 mb-6">
              Faça login para acessar nosso catálogo de livros de computação
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 Plataforma Completa de E-commerce</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Catálogo de produtos com busca e filtros</li>
                <li>✅ Carrinho de compras inteligente</li>
                <li>✅ Pagamentos: PIX, Cartão, Boleto</li>
                <li>✅ Cálculo de frete automático</li>
                <li>✅ Painel administrativo completo</li>
                <li>✅ Suporte a livros físicos e digitais</li>
              </ul>
            </div>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {location.pathname === '/' && <ProductCatalog />}
        {location.pathname === '/cart' && <EnhancedShoppingCart />}
        {location.pathname === '/orders' && <OrderHistory />}
        {location.pathname === '/admin-panel' && <AdminPanel />}
      </Authenticated>
    </div>
  );
}
