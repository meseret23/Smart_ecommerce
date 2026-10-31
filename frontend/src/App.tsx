import React, { useEffect, useState } from 'react';
import { fetchProducts } from './services/productService';
import type { Product } from './services/productService';
import { ProductCard } from './components/ProductCard';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchProducts()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list);
      })
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight cursor-pointer">
              SmartMarket
            </h1>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-indigo-600">Electronics</a>
              <a href="#" className="hover:text-indigo-600">Home & Kitchen</a>
              <a href="#" className="hover:text-indigo-600">Fashion</a>
              <a href="#" className="hover:text-indigo-600">Deals</a>
            </nav>
          </div>

         
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

         
          <div className="flex items-center gap-4 text-sm font-semibold">
            <button className="px-3 py-2 text-gray-700 hover:text-indigo-600">
              🛒 Cart (0)
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              ✨ AI Assistant
            </button>
          </div>
        </div>
      </header>

     
      <section className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-left">
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Ethiopia's Smart Marketplace
          </span>
          <h2 className="text-4xl font-extrabold mt-3 tracking-tight">
            Find the Best Tech & Goods at Great Prices
          </h2>
          <p className="text-indigo-100 text-sm mt-2 max-w-xl">
            Browse through our wide selection of electronics, accessories, and daily essentials priced in ETB.
          </p>
        </div>
      </section>

  
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Featured Products</h3>
          <span className="text-sm text-gray-500">{products.length} items found</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading catalog items...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found. Make sure your backend API is running on port 5000!</div>
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
}

export default App;