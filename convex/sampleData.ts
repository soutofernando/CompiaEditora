import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Sample data for demonstration - this creates initial products and categories
export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create categories first
    const categories = [
      {
        name: "Programação",
        description: "Livros sobre linguagens de programação e desenvolvimento",
        slug: "programacao",
        isActive: true,
      },
      {
        name: "Inteligência Artificial",
        description: "Materiais sobre IA, Machine Learning e Deep Learning",
        slug: "inteligencia-artificial",
        isActive: true,
      },
      {
        name: "Cibersegurança",
        description: "Segurança da informação e proteção digital",
        slug: "ciberseguranca",
        isActive: true,
      },
      {
        name: "Blockchain",
        description: "Tecnologia blockchain e criptomoedas",
        slug: "blockchain",
        isActive: true,
      },
    ];

    const categoryIds = [];
    for (const category of categories) {
      const id = await ctx.db.insert("categories", category);
      categoryIds.push(id);
    }

    // Create sample products
    const products = [
      {
        title: "Python para Iniciantes: Guia Completo",
        description: "Um guia abrangente para aprender Python do zero, com exemplos práticos e projetos reais. Ideal para quem está começando na programação.",
        price: 89.90,
        discountPrice: 69.90,
        category: "Programação",
        tags: ["python", "iniciante", "programação"],
        type: "physical" as const,
        stock: 25,
        isbn: "978-85-1234-567-8",
        author: "Maria Silva",
        publisher: "COMPIA Editora",
        pages: 320,
        language: "Português",
        isActive: true,
        weight: 0.5,
        dimensions: {
          length: 23,
          width: 16,
          height: 2,
        },
      },
      {
        title: "Machine Learning na Prática",
        description: "Aprenda a implementar algoritmos de aprendizado de máquina com Python e scikit-learn. Inclui casos de uso reais e datasets.",
        price: 129.90,
        category: "Inteligência Artificial",
        tags: ["machine learning", "python", "ia", "avançado"],
        type: "physical" as const,
        stock: 15,
        isbn: "978-85-1234-568-5",
        author: "João Santos",
        publisher: "COMPIA Editora",
        pages: 450,
        language: "Português",
        isActive: true,
        weight: 0.7,
        dimensions: {
          length: 24,
          width: 17,
          height: 3,
        },
      },
      {
        title: "Segurança Digital: Guia Essencial",
        description: "E-book completo sobre cibersegurança, incluindo proteção de dados, criptografia e melhores práticas de segurança.",
        price: 49.90,
        discountPrice: 39.90,
        category: "Cibersegurança",
        tags: ["segurança", "criptografia", "proteção"],
        type: "digital" as const,
        stock: 999,
        author: "Ana Costa",
        publisher: "COMPIA Editora",
        pages: 280,
        language: "Português",
        isActive: true,
      },
      {
        title: "Blockchain e Criptomoedas: Fundamentos",
        description: "Entenda a tecnologia por trás das criptomoedas e como implementar soluções blockchain.",
        price: 99.90,
        category: "Blockchain",
        tags: ["blockchain", "bitcoin", "ethereum", "criptomoedas"],
        type: "physical" as const,
        stock: 20,
        isbn: "978-85-1234-569-2",
        author: "Carlos Oliveira",
        publisher: "COMPIA Editora",
        pages: 380,
        language: "Português",
        isActive: true,
        weight: 0.6,
        dimensions: {
          length: 23,
          width: 16,
          height: 2.5,
        },
      },
      {
        title: "Kit Desenvolvedor Full Stack",
        description: "Kit completo com 3 livros: Frontend com React, Backend com Node.js e Banco de Dados. Inclui projetos práticos.",
        price: 249.90,
        discountPrice: 199.90,
        category: "Programação",
        tags: ["full stack", "react", "nodejs", "kit"],
        type: "kit" as const,
        stock: 10,
        author: "Equipe COMPIA",
        publisher: "COMPIA Editora",
        language: "Português",
        isActive: true,
        weight: 1.5,
        dimensions: {
          length: 25,
          width: 18,
          height: 8,
        },
      },
      {
        title: "Deep Learning com TensorFlow",
        description: "E-book avançado sobre redes neurais profundas e implementação com TensorFlow. Inclui códigos e datasets.",
        price: 79.90,
        category: "Inteligência Artificial",
        tags: ["deep learning", "tensorflow", "redes neurais"],
        type: "digital" as const,
        stock: 999,
        author: "Pedro Almeida",
        publisher: "COMPIA Editora",
        pages: 420,
        language: "Português",
        isActive: true,
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return { 
      message: "Dados de exemplo criados com sucesso!",
      categoriesCreated: categories.length,
      productsCreated: products.length
    };
  },
});
