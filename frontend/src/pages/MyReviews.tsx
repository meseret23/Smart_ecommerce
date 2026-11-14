import { useEffect, useState } from 'react';
import api from '../services/api';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewList from '../components/reviews/ReviewList';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  image_url: string | null;
  quantity: number;
  unit_price: string | number;
}

interface Order {
  id: number;
  status: string;
  items: OrderItem[];
}

const BACKEND_URL = 'http://localhost:5000';

const MyReviews = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProduct, setActiveProduct] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      setCurrentUserId(user?.id);
    } catch {
      setCurrentUserId(undefined);
    }
  }, []);

  useEffect(() => {
    const fetchDeliveredProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/orders/my');
        const orders: Order[] = response.data.orders || [];

        const deliveredItems = orders
          .filter((order) =>
            ['delivered', 'completed'].includes(
              order.status.toLowerCase()
            )
          )
          .flatMap((order) => order.items || []);
        const uniqueProducts = Array.from(
          new Map(
            deliveredItems.map((item) => [item.product_id, item])
          ).values()
        );

        setItems(uniqueProducts);
      } catch (err) {
        console.error('Failed to fetch delivered products:', err);
        setError('Unable to load your delivered products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchDeliveredProducts();
  }, []);

  const handleReviewSubmitted = () => {
    setRefreshKey((previous) => previous + 1);
    setActiveProduct(null);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        Loading your delivered products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <main className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            My Reviews
          </h1>
          <p className="text-gray-500 mt-2">
            Share your experience with products you have received.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-xl font-bold text-gray-800">
              No eligible products yet
            </h2>
            <p className="text-gray-500 mt-2">
              Products from your delivered orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <section
                key={item.product_id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-5">

                  {item.image_url ? (
                    <img
                      src={
                        item.image_url.startsWith('http')
                          ? item.image_url
                          : `${BACKEND_URL}${item.image_url}`
                      }
                      alt={item.product_name}
                      className="w-24 h-24 rounded-xl object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}

                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">
                      {item.product_name}
                    </h2>
                    <p className="text-sm text-green-700 mt-2 font-medium">
                      Delivered product
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveProduct(
                        activeProduct === item.product_id
                          ? null
                          : item.product_id
                      )
                    }
                    className="px-5 py-3 rounded-xl bg-[#16845b] hover:bg-[#106746] text-white font-semibold transition"
                  >
                    {activeProduct === item.product_id
                      ? 'Close Review'
                      : '⭐ Write a Review'}
                  </button>
                </div>

                {activeProduct === item.product_id && (
                  <div className="mt-6">
                    <ReviewForm
                      productId={item.product_id}
                      onReviewSubmitted={handleReviewSubmitted}
                    />
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">
                    Customer Reviews
                  </h3>

                  <ReviewList
                    productId={item.product_id}
                    currentUserId={currentUserId}
                    refreshKey={refreshKey}
                     myOnly
                  />
                </div>
              </section>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default MyReviews;