
const API_URL = 'http://localhost:5000/api/orders';

// Order information returned by the backend
export interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number | string;
  created_at: string;
}

// Response when creating an order
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: Order;
}

// Create an order from the customer's database cart
export async function createOrder(): Promise<CreateOrderResponse> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please log in before placing an order.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Could not create your order.');
  }

  return data as CreateOrderResponse;
}

// Response when checking order status
export interface OrderStatusResponse {
  success: boolean;
  order: Order & {
    payment_status: string | null;
  };
}

// Retrieve the authenticated customer's order status
export async function fetchOrderStatus(
  orderId: number
): Promise<OrderStatusResponse> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please log in to view your order.');
  }

  const response = await fetch(
    `${API_URL}/${orderId}/status`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Could not retrieve order status.');
  }

  return data as OrderStatusResponse;
}
