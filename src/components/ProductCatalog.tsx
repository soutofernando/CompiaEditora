import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const products = useQuery(api.products.list, {
    search: searchTerm || undefined,
    category: selectedCategory || undefined,
    type: selectedType as any || undefined,
  }) || [];

  const categories = useQuery(api.categories.list) || [];
  const addToCart = useMutation(api.cart.addItem);

  const handleAddToCart = async (productId: string, title: string) => {
    try {
      await addToCart({ productId: productId as any, quantity: 1 });
      toast.success(`${title} adicionado ao carrinho!`);
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Catálogo de Livros
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Descubra nossa coleção de livros especializados em computação, 
          inteligência artificial e tecnologia.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o título do livro..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="physical">Livro Físico</option>
              <option value="digital">E-book</option>
              <option value="kit">Kit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                  {product.title}
                </h3>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  product.type === 'physical' 
                    ? 'bg-blue-100 text-blue-800'
                    : product.type === 'digital'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {product.type === 'physical' ? 'Físico' : 
                   product.type === 'digital' ? 'Digital' : 'Kit'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">por {product.author}</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {product.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product._id, product.title)}
                  disabled={product.stock === 0}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    product.stock === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {product.stock === 0 ? 'Esgotado' : 'Adicionar'}
                </button>
              </div>
              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-xs text-orange-600 mt-2">
                  Apenas {product.stock} em estoque
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}
