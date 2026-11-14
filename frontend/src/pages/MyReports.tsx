
import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  items: OrderItem[];
}

interface Report {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  description: string;
  status: string;
  image_url: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface MyReportsProps {
  orderId: number | null;
}

const MyReports = ({ orderId }: MyReportsProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedOrder, setSelectedOrder] = useState(orderId?.toString() || '');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [description, setDescription] = useState('');
  const [damageImage, setDamageImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (orderId !== null) {
      setSelectedOrder(orderId.toString());
    }
  }, [orderId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, reportsResponse] = await Promise.all([
          api.get('/orders/my'),
          api.get('/reports'),
        ]);

        const deliveredOrders = (ordersResponse.data.orders || []).filter(
          (order: Order) =>
            ['delivered', 'completed'].includes(order.status.toLowerCase())
        );

        setOrders(deliveredOrders);
        setReports(reportsResponse.data.reports || []);
      } catch (err) {
        console.error('Error loading reports page:', err);
        setError('Unable to load your orders and reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const selectedOrderData = useMemo(
    () => orders.find((order) => order.id.toString() === selectedOrder),
    [orders, selectedOrder]
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'in_review':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedOrder || !selectedProduct || !description.trim() || !damageImage) {
      setError('Please complete every field and attach a photo.');
      return;
    }

    const formData = new FormData();
    formData.append('order_id', selectedOrder);
    formData.append('product_id', selectedProduct);
    formData.append('description', description.trim());
    formData.append('damage_image', damageImage);

    try {
      setSubmitting(true);

      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.report) {
        setReports((previous) => [response.data.report, ...previous]);
      } else {
        const reportsResponse = await api.get('/reports');
        setReports(reportsResponse.data.reports || []);
      }

      setDescription('');
      setDamageImage(null);
      setSelectedProduct('');
      setSuccess('Your damaged-product report was submitted successfully.');

      const fileInput = document.getElementById(
        'damage-image'
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(
        err.response?.data?.message ||
        'Unable to submit your report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Loading your reports...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
        <p className="mt-2 text-gray-500">
          Report damaged products and follow the progress of your reports.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Report a damaged product
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a delivered order and provide details about the damage.
        </p>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {orders.length === 0 ? (
          <p className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            You do not have any delivered orders eligible for a damage report.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="report-order"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Select order
              </label>
              <select
                id="report-order"
                value={selectedOrder}
                onChange={(event) => {
                  setSelectedOrder(event.target.value);
                  setSelectedProduct('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              >
                <option value="">Choose an order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrderData && (
              <div>
                <label
                  htmlFor="report-product"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Select product
                </label>
                <select
                  id="report-product"
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Choose the damaged product</option>
                  {selectedOrderData.items?.map((item) => (
                    <option key={item.id} value={item.product_id}>
                      {item.product_name} (Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="report-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Describe the damage
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Explain what happened to the product..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="damage-image"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Upload a photo
              </label>
              <input
                id="damage-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setDamageImage(event.target.files?.[0] || null)
                }
                className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG, or WebP. Maximum file size: 5 MB.
              </p>
              {damageImage && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {damageImage.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          Previous reports
        </h2>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            You have not submitted any reports yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {report.product_name || `Product #${report.product_id}`}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Order #{report.order_id} · Report #{report.id}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Submitted {formatDate(report.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(report.status)}`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                  {report.description}
                </p>

                {report.image_url && (
                  <img
                    src={
                      report.image_url.startsWith('http')
                        ? report.image_url
                        : `http://localhost:5000${report.image_url}`
                    }
                    alt="Reported product damage"
                    className="mt-4 h-32 w-32 rounded-lg border border-gray-100 object-cover"
                  />
                )}

                {report.admin_notes && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">
                      Admin response
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {report.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyReports;
