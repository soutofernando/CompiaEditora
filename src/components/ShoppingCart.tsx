import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { fetchAddressByCep, formatCep, isValidCep, type AddressData } from "../lib/cepService";

export function ShoppingCart() {
  const cartItems = useQuery(api.cart.getCart) || [];
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const createOrder = useMutation(api.orders.createFromCart);
  const clearCart = useMutation(api.cart.clearCart);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
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
  const shippingCost = hasPhysicalItems ? 15.00 : 0;
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

  const handleZipCodeBlur = async () => {
    if (!shippingAddress.zipCode || !isValidCep(shippingAddress.zipCode)) {
      return;
    }

    try {
      const address = await fetchAddressByCep(shippingAddress.zipCode);
      if (address) {
        handleAddressFound(address);
        toast.success("Endereço encontrado e preenchido automaticamente!");
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      // Não mostra erro para o usuário, pois pode ser um CEP válido mas não encontrado
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (hasPhysicalItems && (!shippingAddress.street || !shippingAddress.city)) {
      toast.error("Preencha o endereço de entrega para itens físicos");
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await createOrder({
        paymentMethod,
        shippingAddress: hasPhysicalItems ? shippingAddress : undefined,
      });
      
      toast.success(`Pedido ${result.orderNumber} criado com sucesso!`);
      setIsCheckingOut(false);
    } catch (error) {
      toast.error("Erro ao criar pedido");
      setIsCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Carrinho limpo");
    } catch (error) {
      toast.error("Erro ao limpar carrinho");
    }
  };

  if (cartItems.length === 0) {
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

        {/* Order Summary & Checkout */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {hasPhysicalItems && (
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{formatPrice(shippingCost)}</span>
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

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Forma de Pagamento</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="credit_card"
                  checked={paymentMethod === "credit_card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                Cartão de Crédito
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pix"
                  checked={paymentMethod === "pix"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                PIX
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="boleto"
                  checked={paymentMethod === "boleto"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                Boleto
              </label>
            </div>
          </div>

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
                    onChange={(e) => setShippingAddress({...shippingAddress, zipCode: formatCep(e.target.value)})}
                    onBlur={handleZipCodeBlur}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={9}
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

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? "Processando..." : "Finalizar Compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
