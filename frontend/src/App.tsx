import React, { useEffect, useState } from 'react';
import { fetchProducts } from './services/productService';
import type { Product } from './services/productService';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { Checkout } from './pages/Checkout';
import { getCurrentUser, logoutUser } from './services/authService';
import { AuthModal } from './components/AuthModal';

export interface CartItem extends Product {
  quantity: number;
}

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'shop' | 'checkout'>('shop');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

 
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

 
  const handleIncreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };


  const handleDecreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };


  const handleRemoveItem = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts(searchQuery, selectedCategoryId);
        const list = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.products || [];
        setProducts(list);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryId]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      
      {/* Header */}
     <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-8">
      <h1 
        onClick={() => {
          setSelectedCategoryId(undefined);
          setCurrentPage('shop');
        }}
        className="text-2xl font-black text-indigo-600 tracking-tight cursor-pointer"
      >
        SmartMarket
      </h1>
      <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
        <button
          onClick={() => {
            setSelectedCategoryId(undefined);
            setCurrentPage('shop');
          }}
          className={`transition cursor-pointer ${selectedCategoryId === undefined ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1' : 'hover:text-indigo-600'}`}
        >
          All
        </button>
        <button
          onClick={() => {
            setSelectedCategoryId(1);
            setCurrentPage('shop');
          }}
          className={`transition cursor-pointer ${selectedCategoryId === 1 ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1' : 'hover:text-indigo-600'}`}
        >
          Electronics
        </button>
        <button
          onClick={() => {
            setSelectedCategoryId(2);
            setCurrentPage('shop');
          }}
          className={`transition cursor-pointer ${selectedCategoryId === 2 ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1' : 'hover:text-indigo-600'}`}
        >
          Home & Kitchen
        </button>
        <button
          onClick={() => {
            setSelectedCategoryId(3);
            setCurrentPage('shop');
          }}
          className={`transition cursor-pointer ${selectedCategoryId === 3 ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1' : 'hover:text-indigo-600'}`}
        >
          Fashion
        </button>
      </nav>
    </div>

    {/* Search Input */}
    <div className="flex-1 max-w-md">
      <input
        type="text"
        placeholder="Search products, brands, categories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    {/* Cart, Auth & AI Buttons */}
    <div className="flex items-center gap-3 text-sm font-semibold">
      <button 
        onClick={() => setIsCartOpen(true)}
        className="px-3 py-2 text-gray-700 hover:text-indigo-600 cursor-pointer"
      >
        🛒 Cart ({totalCartCount})
      </button>

      {/* User Auth Section */}
      {user ? (
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
          <span className="text-gray-800 text-xs font-semibold">
            👤 {user.fullName || user.name || 'User'}
          </span>
          <button
            onClick={() => {
              logoutUser();
              setUser(null);
            }}
            className="text-[11px] text-red-500 hover:underline cursor-pointer ml-1"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAuthOpen(true)}
          className="px-3 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer text-xs uppercase tracking-wide font-bold"
        >
          Sign In
        </button>
      )}

      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer">
        ✨ AI Assistant
      </button>
    </div>
  </div>
</header>

      {/* Hero Section */}
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

      {/* Main Product Grid */}
    <main className="max-w-7xl mx-auto px-6 py-10 flex-grow">
  {currentPage === 'checkout' ? (
    <Checkout
      cart={cart}
      onClearCart={() => setCart([])}
      onBackToShop={() => setCurrentPage('shop')}
    />
  ) : (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Featured Products</h3>
        <span className="text-sm text-gray-500">{products.length} items found</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading catalog items...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No products found. Make sure your backend API is running on port 5000!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => handleAddToCart(product)} 
            />
          ))}
        </div>
      )}
    </>
  )}
</main>

     
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-lg font-bold">Your Shopping Cart ({totalCartCount})</h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-gray-700 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-20">Your cart is empty.</p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">{item.price} ETB × {item.quantity}</p>
                      </div>
                      <span className="font-bold text-indigo-600">
                        {(Number(item.price) * item.quantity).toFixed(2)} ETB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>
                  {cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toFixed(2)} ETB
                </span>
              </div>
              <button 
                onClick={() => alert('Checkout flow coming up!')}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setCurrentPage('checkout');
        }}
      />

      {/* ✅ ADD THE AUTH MODAL HERE SO IT RENDERS PROPERLY */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsAuthOpen(false);
        }}
      />

    </div>  
  );
}

export default App;