import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface PaymentFormProps {
  orderId: string;
  total: number;
  onPaymentSuccess: () => void;
}

export function PaymentForm({ orderId, total, onPaymentSuccess }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  
  const paymentMethods = useQuery(api.payments.getPaymentMethods) || [];
  const generatePixPayment = useAction(api.payments.generatePixPayment);
  const processCreditCard = useAction(api.payments.processCreditCardPayment);
  const updatePaymentStatus = useMutation(api.payments.updatePaymentStatus);

  const [cardData, setCardData] = useState({
    number: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handlePixPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await generatePixPayment({
        orderId: orderId as any,
        amount: total,
      });
      setPixData(result);
      toast.success("Código PIX gerado! Escaneie o QR Code para pagar.");
    } catch (error) {
      toast.error("Erro ao gerar PIX");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreditCardPayment = async () => {
    if (!cardData.number || !cardData.holderName || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv) {
      toast.error("Preencha todos os dados do cartão");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processCreditCard({
        orderId: orderId as any,
        amount: total,
        cardData,
      });

      if (result.success) {
        await updatePaymentStatus({
          orderId: orderId as any,
          paymentStatus: "paid",
          transactionId: result.transactionId,
        });
        toast.success("Pagamento aprovado!");
        onPaymentSuccess();
      } else {
        toast.error(result.error || "Pagamento recusado");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoletoPayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate boleto generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Boleto gerado! Você receberá o link por email.");
      
      // In a real implementation, you would generate the actual boleto
      // and update the payment status accordingly
    } catch (error) {
      toast.error("Erro ao gerar boleto");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    switch (selectedMethod) {
      case "pix":
        handlePixPayment();
        break;
      case "credit_card":
        handleCreditCardPayment();
        break;
      case "boleto":
        handleBoletoPayment();
        break;
      default:
        toast.error("Método de pagamento não suportado");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Pagamento</h3>
      <div className="mb-4">
        <p className="text-2xl font-bold text-green-600">
          Total: {formatPrice(total)}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => (
          <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{method.icon}</span>
                <span className="font-medium">{method.name}</span>
              </div>
              <p className="text-sm text-gray-600">{method.description}</p>
              <p className="text-xs text-gray-500">Processamento: {method.processingTime}</p>
            </div>
          </label>
        ))}
      </div>

      {/* PIX Payment */}
      {selectedMethod === "pix" && (
        <div className="space-y-4">
          {!pixData ? (
            <button
              onClick={handlePixPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? "Gerando PIX..." : "Gerar Código PIX"}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">Escaneie o QR Code ou copie o código PIX:</p>
              <img
                src={pixData.qrCodeUrl}
                alt="QR Code PIX"
                className="mx-auto border rounded"
              />
              <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                {pixData.pixCode}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(pixData.pixCode)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Copiar código PIX
              </button>
              <p className="text-xs text-gray-500">
                Código expira em: {new Date(pixData.expiresAt).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Credit Card Payment */}
      {selectedMethod === "credit_card" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Número do cartão"
              value={cardData.number}
              onChange={(e) => setCardData({...cardData, number: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={19}
            />
            <input
              type="text"
              placeholder="Nome no cartão"
              value={cardData.holderName}
              onChange={(e) => setCardData({...cardData, holderName: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-3 gap-4">
              <select
                value={cardData.expiryMonth}
                onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Mês</option>
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={cardData.expiryYear}
                onChange={(e) => setCardData({...cardData, expiryYear: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Ano</option>
                {Array.from({length: 10}, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <input
                type="text"
                placeholder="CVV"
                value={cardData.cvv}
                onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
            </div>
          </div>
          <button
            onClick={handleCreditCardPayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? "Processando..." : "Pagar com Cartão"}
          </button>
        </div>
      )}

      {/* Boleto Payment */}
      {selectedMethod === "boleto" && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              O boleto será enviado para seu email e terá vencimento em 3 dias úteis.
              Após o pagamento, o pedido será processado em até 2 dias úteis.
            </p>
          </div>
          <button
            onClick={handleBoletoPayment}
            disabled={isProcessing}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-orange-700 disabled:opacity-50"
          >
            {isProcessing ? "Gerando boleto..." : "Gerar Boleto"}
          </button>
        </div>
      )}
    </div>
  );
}
