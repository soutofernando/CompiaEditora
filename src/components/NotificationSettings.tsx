import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function NotificationSettings() {
  const [isUpdating, setIsUpdating] = useState(false);
  const settings = useQuery(api.notifications.getNotificationSettings);
  const updateSettings = useMutation(api.notifications.updateNotificationSettings);

  const [formData, setFormData] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  useState(() => {
    if (settings) {
      setFormData(settings);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      await updateSettings(formData);
      toast.success("Configurações de notificação atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar configurações");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Configurações de Notificação</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Notificações por Email</span>
              <p className="text-sm text-gray-600">Receber emails sobre pedidos e atualizações</p>
            </div>
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Atualizações de Pedidos</span>
              <p className="text-sm text-gray-600">Notificações sobre status do pedido</p>
            </div>
            <input
              type="checkbox"
              checked={formData.orderUpdates}
              onChange={(e) => handleChange('orderUpdates', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Promoções e Ofertas</span>
              <p className="text-sm text-gray-600">Emails sobre descontos e lançamentos</p>
            </div>
            <input
              type="checkbox"
              checked={formData.promotions}
              onChange={(e) => handleChange('promotions', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Newsletter</span>
              <p className="text-sm text-gray-600">Conteúdo educacional e novidades da editora</p>
            </div>
            <input
              type="checkbox"
              checked={formData.newsletter}
              onChange={(e) => handleChange('newsletter', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
