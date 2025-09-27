import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentForm } from "./PaymentForm";
import { ShippingCalculator } from "./ShippingCalculator";
import { type AddressData } from "../lib/cepService";

export function EnhancedShoppingCart() {
  const cartItems = useQuery(api.cart.getCart) || [];
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const createOrder = useMutation(api.orders.createFromCart);
  const clearCart = useMutation(api.cart.clearCart);

  const [currentStep, setCurrentStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    if (!item) return sum;
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const hasPhysicalItems = cartItems.some(item => item && item.product.type === "physical");
  const shippingCost = selectedShipping ? selectedShipping.price : (hasPhysicalItems ? 15.00 : 0);
  const tax = subtotal * 0.1;
  const total = subtotal + shippingCost + tax;

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity({ itemId: itemId as any, quantity });
    } catch (error) {
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const handleRemoveItem = async (itemId: string, title: string) => {
    try {
      await removeItem({ itemId: itemId as any });
      toast.success(`${title} removido do carrinho`);
    } catch (error) {
      toast.error("Erro ao remover item");
    }
  };

  const handleProceedToShipping = () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    setCurrentStep('shipping');
  };

  const handleProceedToPayment = async () => {
    if (hasPhysicalItems && (!shippingAddress.street || !shippingAddress.city)) {
      toast.error("Preencha o endereço de entrega para itens físicos");
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await createOrder({
        paymentMethod: "pending", // Will be updated after payment
        shippingAddress: hasPhysicalItems ? shippingAddress : undefined,
      });
      
      setCurrentOrderId(result.orderId);
      setCurrentStep('payment');
      toast.success("Pedido criado! Prossiga com o pagamento.");
    } catch (error) {
      toast.error("Erro ao criar pedido");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
    toast.success("Pagamento realizado com sucesso!");
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Carrinho limpo");
      setCurrentStep('cart');
    } catch (error) {
      toast.error("Erro ao limpar carrinho");
    }
  };

  const handleShippingSelected = (option: any) => {
    setSelectedShipping(option);
  };

  const handleAddressFound = (address: AddressData) => {
    setShippingAddress(prev => ({
      ...prev,
      street: address.street,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      complement: address.complement || prev.complement,
    }));
  };

  if (cartItems.length === 0 && currentStep === 'cart') {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Seu carrinho está vazio
        </h3>
        <p className="text-gray-500">
          Adicione alguns livros ao seu carrinho para continuar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { key: 'cart', label: 'Carrinho', icon: '🛒' },
          { key: 'shipping', label: 'Entrega', icon: '📦' },
          { key: 'payment', label: 'Pagamento', icon: '💳' },
          { key: 'confirmation', label: 'Confirmação', icon: '✅' },
        ].map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === step.key 
                ? 'bg-blue-600 text-white' 
                : index < ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStep)
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="text-sm">{step.icon}</span>
            </div>
            <span className={`ml-2 text-sm ${
              currentStep === step.key ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}>
              {step.label}
            </span>
            {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {/* Cart Step */}
      {currentStep === 'cart' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Carrinho de Compras</h2>
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Limpar carrinho
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.filter(Boolean).map((item) => (
                <div key={item._id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                      <p className="text-sm text-gray-600">por {item.product.author}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Tipo: {item.product.type === 'physical' ? 'Físico' : 
                               item.product.type === 'digital' ? 'Digital' : 'Kit'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item._id, item.product.title)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impostos</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToShipping}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700"
              >
                Continuar para Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Step */}
      {currentStep === 'shipping' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentStep('cart')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Voltar ao Carrinho
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Entrega e Endereço</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Shipping Calculator */}
              <ShippingCalculator
                items={cartItems.filter(Boolean).map(item => ({
                  weight: item.product.weight || 0.5,
                  dimensions: item.product.dimensions,
                  type: item.product.type,
                }))}
                onShippingSelected={handleShippingSelected}
                onAddressFound={handleAddressFound}
              />

              {/* Shipping Address */}
              {hasPhysicalItems && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Endereço de Entrega</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Rua"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Número"
                        value={shippingAddress.number}
                        onChange={(e) => setShippingAddress({...shippingAddress, number: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Complemento (opcional)"
                      value={shippingAddress.complement}
                      onChange={(e) => setShippingAddress({...shippingAddress, complement: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={shippingAddress.neighborhood}
                        onChange={(e) => setShippingAddress({...shippingAddress, neighborhood: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="CEP"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Estado"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Updated Order Summary */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Resumo Atualizado</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  {selectedShipping && (
                    <div className="text-sm text-gray-600">
                      {selectedShipping.name} - {selectedShipping.deliveryTime}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Impostos</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={isCheckingOut || (hasPhysicalItems && !selectedShipping)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? "Processando..." : "Continuar para Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Step */}
      {currentStep === 'payment' && currentOrderId && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentStep('shipping')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Voltar para Entrega
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Pagamento</h2>
          </div>

          <PaymentForm
            orderId={currentOrderId}
            total={total}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      )}

      {/* Confirmation Step */}
      {currentStep === 'confirmation' && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-green-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Pedido Confirmado!
          </h3>
          <p className="text-gray-600 mb-6">
            Seu pedido foi processado com sucesso. Você receberá um email de confirmação em breve.
          </p>
          <button
            onClick={() => {
              setCurrentStep('cart');
              setCurrentOrderId(null);
              setSelectedShipping(null);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700"
          >
            Fazer Novo Pedido
          </button>
        </div>
      )}
    </div>
  );
}
