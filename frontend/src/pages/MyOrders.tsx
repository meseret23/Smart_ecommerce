
import { useEffect, useState } from 'react';
import api from '../services/api';

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
  total_amount: string | number;
  created_at: string;
  items: OrderItem[];
}

interface MyOrdersProps {
  onReportClick: (orderId: number) => void;
}

const MyOrders = ({ onReportClick }: MyOrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/my');
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Unable to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const formatPrice = (price: string | number) =>
    Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading your orders...</div>;
  }

  if (error) {
    return <div className="py-16 text-center text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-2">
          View your purchases and track your orders.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">No orders yet</h2>
          <p className="text-gray-500 mt-2">
            Your purchases will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const canReport = ['delivered', 'completed'].includes(
              order.status.toLowerCase()
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex flex-wrap justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Order #{order.id}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="font-bold text-gray-900 mt-2">
                      {formatPrice(order.total_amount)} ETB
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.image_url ? (
                        <img
                          src={
                            item.image_url.startsWith('http')
                              ? item.image_url
                              : `http://localhost:5000${item.image_url}`
                          }
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-medium text-gray-800">
                        {formatPrice(Number(item.unit_price) * item.quantity)} ETB
                      </p>
                    </div>
                  ))}
                </div>

                {canReport && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => onReportClick(order.id)}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 transition"
                    >
                      Report a damaged product →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
