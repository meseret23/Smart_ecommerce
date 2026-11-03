import React, { useEffect, useState } from 'react';
import { fetchProducts } from './services/productService';
import type { Product } from './services/productService';
import { ProductCard } from './components/ProductCard';
import { AuthPage } from './components/AuthPage';
import { AIAssistantModal } from './components/AIAssistantModal';
import { initializeChapaPayment } from './services/paymentService';

interface CartItem extends Product {
  quantity: number;
}

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'store' | 'cart'>('store');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return (savedUser && token) ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      fetchProducts()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : data?.products || [];
          setProducts(list);
        })
        .catch((err) => console.error('Failed to load products:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);
  const handleChapaCheckout = async () => {
  if (cart.length === 0) return;
  setIsCheckingOut(true);

  try {
    const checkoutUrl = await initializeChapaPayment({
      amount: totalPrice,
      email: user?.email || 'testuser@gmail.com',
      firstName: user?.full_name || 'Customer',
    });

    // Redirect user to Chapa Payment Gateway!
    window.location.href = checkoutUrl;
  } catch (err) {
    console.error('Checkout failed:', err);
    alert('Payment initialization failed. Please check backend configuration.');
  } finally {
    setIsCheckingOut(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
  };

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string | number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const filteredProducts = products.filter((p) => {
    const item = p as any;
    const title = (item.title || item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || category.includes(query);

    if (selectedCategory === 'All') return matchesSearch;

    const targetCat = selectedCategory.toLowerCase();
    const matchesCategory = 
      category.includes(targetCat) || 
      (category === 'general' && targetCat === 'electronics' && /(mouse|watch|headphone|audio|tech|wireless|device)/i.test(title));

    return matchesSearch && matchesCategory;
  });

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  if (!user) {
    return (
      <AuthPage 
        onSuccess={(loggedInUser) => setUser(loggedInUser)} 
        onBackToHome={() => {}} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <h1 
              onClick={() => { setActiveTab('store'); setSelectedCategory('All'); }} 
              className="text-2xl font-black text-indigo-600 tracking-tight cursor-pointer"
            >
              SmartMarket
            </h1>
            <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-600">
              {['All', 'Electronics', 'Home & Kitchen', 'Fashion', 'Deals'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setActiveTab('store'); }}
                  className={`hover:text-indigo-600 transition ${
                    selectedCategory === cat ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-0.5' : ''
                  }`}
                >
                  {cat}
                </button>
              ))}
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
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <span className="text-indigo-700 font-bold">Hi, {user.full_name}</span>
              <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600 ml-1 font-semibold transition">
                Logout
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('cart')}
              className="relative flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full transition"
            >
              🛒 Cart ({totalCartItems})
            </button>
            
           <button 
  onClick={() => setIsAIOpen(true)}
  className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition shadow-sm"
>
  ✨ AI Assistant
</button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {activeTab === 'store' && (
        <section className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-10 px-6">
          <div className="max-w-7xl mx-auto text-left">
            <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Ethiopia's Smart Marketplace
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">
              Find the Best Tech & Goods at Great Prices
            </h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Showing items for: <span className="font-bold text-white uppercase">{selectedCategory}</span>
            </p>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'cart' ? (
          <div>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h2>
                {cart.length > 0 && (
                  <button 
                    onClick={handleClearCart}
                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('store')}
                className="text-sm font-semibold text-indigo-600 hover:underline"
              >
                ← Continue Shopping
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 text-lg mb-4">Your cart is currently empty.</p>
                <button 
                  onClick={() => setActiveTab('store')}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <div>
                      <h4 className="font-bold text-gray-900">{(item as any).title || (item as any).name}</h4>
                      <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {(item as any).category || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="px-3 py-1 hover:bg-gray-200 text-gray-700 font-bold transition"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-semibold text-gray-900 bg-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="px-3 py-1 hover:bg-gray-200 text-gray-700 font-bold transition"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <span className="font-extrabold text-indigo-600">
                          {(Number(item.price) * item.quantity).toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Checkout Summary Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center mt-6 shadow-sm">
                  <div>
                    <span className="text-sm text-gray-500">Total Items: {totalCartItems}</span>
                    <h3 className="text-xl font-black text-gray-900">
                      Total: {totalPrice.toFixed(2)} ETB
                    </h3>
                  </div>
                 <button 
  onClick={handleChapaCheckout}
  disabled={isCheckingOut}
  className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
>
  {isCheckingOut ? 'Initializing Chapa...' : 'Proceed to Chapa Checkout →'}
</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedCategory === 'All' ? 'Featured Products' : `${selectedCategory} Catalog`}
              </h3>
              <span className="text-sm text-gray-500">{filteredProducts.length} items found</span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500">Loading catalog items...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No products found in "{selectedCategory}". Try changing categories or search term!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition">
                    <div className="mb-2">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {(product as any).category || 'General'}
                      </span>
                    </div>
                    <ProductCard product={product} />
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition shadow-xs text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <AIAssistantModal 
  isOpen={isAIOpen}
  onClose={() => setIsAIOpen(false)}
  products={products}
  onAddToCart={handleAddToCart}
/>
    </div>
  );
}

export default App;