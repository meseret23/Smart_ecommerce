
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MyReviews from './pages/MyReviews';

import { createOrder } from './services/orderService';
import { fetchProducts } from './services/productService';
import type { Product } from './services/productService';
import { initializeChapaPayment } from './services/paymentService';


import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  verifyCart,
} from './services/cartService';

import { ProductCard } from './components/ProductCard';
import { AuthPage } from './components/AuthPage';
import { AIAssistantModal } from './components/AIAssistantModal';


import HomePage from './pages/Home';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import ProductDetails from './pages/ProductDetails';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminReports from './pages/admin/AdminReports';

import AppRoutes from './routes/AppRoutes';

interface CartItem extends Product {
  quantity: number;
}

function mapCartItems(items: any[]): CartItem[] {
  return items.map((item) => ({
    id: Number(item.product_id),
    name: item.name,
    price: Number(item.price),
    description: item.description || '',
    stock_quantity: Number(item.stock_quantity ?? 0),
    category: item.category || 'General',
    image_url: item.image_url,
    quantity: Number(item.quantity),
  }));
}

export function App() {
  const navigate = useNavigate();

  // Shared application state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  // Load products
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsData: Product[] = await fetchProducts();

        if (isMounted) {
          setProducts(Array.isArray(productsData) ? productsData : []);
        }
      } catch (error) {
        console.error('Failed to load products:', error);

        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cart totals
  const totalCartItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  // Load customer cart
  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }

    let isMounted = true;

    const loadCart = async () => {
      try {
        const response = await fetchCart();

        if (isMounted) {
          setCart(mapCartItems(response.items));
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    };

    void loadCart();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Cart functions
  const handleAddToCart = async (product: Product): Promise<void> => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(product.id, 1);

      const response = await fetchCart();
      setCart(mapCartItems(response.items));
    } catch (error) {
      console.error('Failed to add product:', error);
      alert(error instanceof Error ? error.message : 'Could not add product.');
    }
  };

  const handleUpdateQuantity = async (
    id: string | number,
    delta: number
  ): Promise<void> => {
    const item = cart.find((item) => item.id === Number(id));
    if (!item) return;

    const newQuantity = item.quantity + delta;

    try {
      if (newQuantity <= 0) {
        await removeCartItem(Number(id));
      } else {
        await updateCartItem(Number(id), newQuantity);
      }

      const response = await fetchCart();
      setCart(mapCartItems(response.items));
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert(error instanceof Error ? error.message : 'Could not update cart.');
    }
  };

  const handleClearCart = async (): Promise<void> => {
    try {
      await clearCart();
      setCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      alert(error instanceof Error ? error.message : 'Could not clear cart.');
    }
  };

  // Chapa checkout
  const handleChapaCheckout = async (): Promise<void> => {
    if (cart.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);

    try {
      const verification = await verifyCart();

      if (!verification.is_valid) {
        throw new Error(
          verification.message || 'Some cart items are unavailable.'
        );
      }

      const orderResponse = await createOrder();
      const orderId = orderResponse.order.id;

      setCart([]);
const payment = await initializeChapaPayment(orderId);

// Preserve the transaction reference for the success page

sessionStorage.setItem('chapa_tx_ref', payment.tx_ref);
window.location.href = payment.checkout_url;
    } catch (error) {
      console.error('Checkout failed:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Checkout failed. Please try again.'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Logout
  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setCart([]);
    navigate('/');
  };

  // Search
  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);

    if (value.trim()) {
      navigate('/products');
    }
  };

  const filteredProducts = products.filter((product) => {
    const title = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return title.includes(query) || category.includes(query);
  });

  // Cart page
  const cartPage = (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Your Shopping Cart</h2>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
            >
              Clear All
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/products')}
          className="text-sm font-semibold text-green-700 hover:underline"
        >
          ← Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-500 text-lg mb-4">
            Your cart is currently empty.
          </p>

          <button
            onClick={() => navigate('/products')}
            className="bg-green-700 text-white px-6 py-2.5 rounded-xl font-semibold"
          >
            Start Browsing
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-white p-4 rounded-xl border"
            >
              <div>
                <h4 className="font-bold">{item.name}</h4>
                <span className="inline-block mt-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {item.category || 'General'}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="px-3 py-1 hover:bg-gray-100 font-bold"
                  >
                    -
                  </button>

                  <span className="px-3 py-1 text-sm font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="px-3 py-1 hover:bg-gray-100 font-bold"
                  >
                    +
                  </button>
                </div>

                <span className="font-extrabold text-green-700 min-w-[100px] text-right">
                  {(Number(item.price) * item.quantity).toFixed(2)} ETB
                </span>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-2xl border flex justify-between items-center mt-6">
            <div>
              <span className="text-sm text-gray-500">
                Total Items: {totalCartItems}
              </span>

              <h3 className="text-xl font-black">
                Total: {totalPrice.toFixed(2)} ETB
              </h3>
            </div>

            <button
              onClick={handleChapaCheckout}
              disabled={isCheckingOut}
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {isCheckingOut
                ? 'Initializing Chapa...'
                : 'Proceed to Chapa Checkout →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Product catalog
  const productsPage = (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {searchQuery ? 'Search Results' : 'Explore Products'}
        </h2>

        <span className="text-sm text-gray-500">
          {filteredProducts.length} items found
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Loading catalog items...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No products found. Try another search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
            >
              <ProductCard product={product} />

              <button
                onClick={() => handleAddToCart(product)}
                className="w-full mt-3 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-xl text-sm"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Authentication
  const loginPage = (
    <AuthPage
      onSuccess={(loggedInUser) => {
        setUser(loggedInUser);
        navigate('/');
      }}
      onBackToHome={() => navigate('/')}
    />
  );

  return (
    <>
      <AppRoutes
        user={user}
        cartCount={totalCartItems}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onLogout={handleLogout}
        home={<HomePage />}
        products={productsPage}
        productDetails={<ProductDetails />}
        login={loginPage}
        resetPassword={<ResetPassword />}
        cart={cartPage}
        checkout={cartPage}
        orderSuccess={<OrderSuccess />}
        orders={
          <MyOrders
            onReportClick={(orderId) => {
              setSelectedOrderId(orderId);
              navigate('/reports');
            }}
          />
        }
        reports={<MyReports orderId={selectedOrderId} />}
        profile={<Profile />}
        myReviews={<MyReviews />}
        adminDashboard={<AdminDashboard />}
        adminProducts={<AdminProducts />}
        adminReports={<AdminReports />}
      />

      {user && (
        <>
         

          <AIAssistantModal
            isOpen={isAIOpen}
            onClose={() => setIsAIOpen(false)}
            products={products}
            onAddToCart={(product: any) => handleAddToCart(product)}
          />

          <button
  type="button"
  onClick={() => setIsAIOpen(true)}
  className="ai-assistant-trigger"
>
  <span>✨</span>
  AI Assistant
</button>
        </>
      )}
    </>
  );
}

export default App;
