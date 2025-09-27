import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { fetchAddressByCep, formatCep, isValidCep, type AddressData } from "../lib/cepService";

interface ShippingCalculatorProps {
  items: Array<{
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    type: "physical" | "digital" | "kit";
  }>;
  onShippingSelected: (option: any) => void;
  onAddressFound?: (address: AddressData) => void;
}

export function ShippingCalculator({ items, onShippingSelected, onAddressFound }: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState("");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const calculateShipping = useAction(api.shipping.calculateShipping);
  const validateZipCode = useAction(api.shipping.validateZipCode);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setZipCode(formatted);
  };

  const handleZipCodeBlur = async () => {
    if (!zipCode || !isValidCep(zipCode)) {
      return;
    }

    setIsLoadingAddress(true);
    try {
      const address = await fetchAddressByCep(zipCode);
      if (address && onAddressFound) {
        onAddressFound(address);
        toast.success("Endereço encontrado e preenchido automaticamente!");
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleCalculateShipping = async () => {
    if (!zipCode || !isValidCep(zipCode)) {
      toast.error("Digite um CEP válido");
      return;
    }

    setIsCalculating(true);
    try {
      const validation = await validateZipCode({ zipCode: zipCode.replace(/\D/g, '') });
      
      if (!validation.valid) {
        toast.error(validation.message || "CEP inválido");
        return;
      }

      const result = await calculateShipping({
        zipCode: zipCode.replace(/\D/g, ''),
        items,
      });

      setShippingOptions(result.options);
      
      if (result.options.length === 0) {
        toast.info(result.message || "Nenhuma opção de frete disponível");
      } else {
        toast.success("Opções de frete calculadas!");
      }
    } catch (error) {
      toast.error("Erro ao calcular frete");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectOption = (option: any) => {
    setSelectedOption(option);
    onShippingSelected(option);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Calcular Frete</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Digite seu CEP"
              value={zipCode}
              onChange={handleZipCodeChange}
              onBlur={handleZipCodeBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={9}
            />
            {isLoadingAddress && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <button
            onClick={handleCalculateShipping}
            disabled={isCalculating || isLoadingAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCalculating ? "Calculando..." : "Calcular"}
          </button>
        </div>

        {shippingOptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Opções de Entrega:</h4>
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedOption?.id === option.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    value={option.id}
                    checked={selectedOption?.id === option.id}
                    onChange={() => handleSelectOption(option)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                    <div className="text-xs text-gray-500">{option.deliveryTime}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(option.price)}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {items.filter(item => item.type === "physical").length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>Apenas produtos digitais no carrinho.</p>
            <p>Frete não necessário.</p>
          </div>
        )}
      </div>
    </div>
  );
}
