import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-indigo-900 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="bg-indigo-800 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Ethiopia's Smart Marketplace
          </span>
          <h1 className="text-4xl font-extrabold mt-4 tracking-tight">
            Find the Best Tech & Goods at Great Prices
          </h1>
          <p className="text-indigo-200 mt-3 text-lg">
            Browse through our wide selection of electronics, accessories, and daily essentials priced in ETB.
          </p>
        </div>
      </section>

      {/* Product Grid Section */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h3>

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
            <p className="text-lg font-semibold text-gray-700">0 items found</p>
            <p className="text-sm mt-1">No products found. Make sure your database has products seeded!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};