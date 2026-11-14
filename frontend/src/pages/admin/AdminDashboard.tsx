
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "failed",
];

interface Product {
  id: number;
  name: string;
}

interface Order {
  id?: number;
  order_id?: number;
  status?: string;
  total_amount?: number | string;
  total_price?: number | string;
  total?: number | string;
  created_at?: string;
  full_name?: string;
  customer_name?: string;
  customer_email?: string;
  email?: string;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token");

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/products`, {
          headers: requestHeaders,
        }),
        fetch(`${API_BASE_URL}/orders`, {
          headers: requestHeaders,
        }),
      ]);

      if (!productsResponse.ok) {
        throw new Error("Could not load products.");
      }

      if (!ordersResponse.ok) {
        throw new Error("Could not load orders.");
      }

      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();
      console.log("Orders:", JSON.stringify(ordersData, null, 2));
console.log("First order:", ordersData.orders?.[0]);
      setProducts(
        Array.isArray(productsData)
          ? productsData
          : productsData.products || productsData.data || []
      );

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || ordersData.data || []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrderId = (order: Order) =>
    Number(order.order_id ?? order.id);

  const getOrderTotal = (order: Order) =>
    Number(order.total_amount ?? order.total_price ?? order.total ?? 0);

  const pendingOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "pending"
  );

  const totalRevenue = orders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  // Search and filter orders together.
 const filteredOrders = [...orders]
  .filter((order) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(getOrderId(order)).toLowerCase().includes(query) ||
      (order.customer_name || "").toLowerCase().includes(query) ||
      (order.customer_email || "").toLowerCase().includes(query) ||
      (order.full_name || "").toLowerCase().includes(query) ||
      (order.email || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
  );

  const updateOrderStatus = async (
    orderId: number,
    status: string
  ) => {
    try {
      setUpdatingOrder(orderId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: requestHeaders,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Could not update order status."
        );
      }

      setOrders((previous) =>
        previous.map((order) =>
          getOrderId(order) === orderId
            ? { ...order, status }
            : order
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update order."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-700";
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "paid":
      case "confirmed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your store and manage recent orders.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {products.length}
          </h2>
          <p className="mt-1 text-xs text-gray-400">Products in catalog</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {orders.length}
          </h2>
          <p className="mt-1 text-xs text-gray-400">Orders received</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <h2 className="mt-2 text-3xl font-bold text-yellow-600">
            {pendingOrders.length}
          </h2>
          <p className="mt-1 text-xs text-gray-400">Awaiting processing</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Order Value</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {totalRevenue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Sum of order totals, not confirmed profit
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Order Management
          </h2>
          <p className="text-sm text-gray-500">
            Search orders, filter by status, and update order progress.
          </p>
        </div>

    
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer name, or email..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>

            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>

          {(searchQuery || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No orders match your search or selected status.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Update Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order, index) => {
                  const orderId = getOrderId(order);

                  return (
                    <tr
                      key={orderId || index}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-medium">
                        #{orderId || "—"}
                      </td>

                     <td className="p-3">
  {order.customer_name ||
    order.full_name ||
    order.customer_email ||
    order.email ||
    "Customer"}
</td>

                      <td className="p-3">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="p-3">
                        {getOrderTotal(order).toLocaleString()}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          {order.status || "Unknown"}
                        </span>
                      </td>

                      <td className="p-3">
                        <select
                          value={order.status || ""}
                          disabled={updatingOrder === orderId}
                          onChange={(e) =>
                            updateOrderStatus(orderId, e.target.value)
                          }
                          className="rounded-lg border p-2 disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Select status
                          </option>

                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>

                        {updatingOrder === orderId && (
                          <span className="ml-2 text-xs text-gray-500">
                            Saving...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
