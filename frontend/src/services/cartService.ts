
const API_URL = 'http://localhost:5000/api/cart';



export interface CartItem {
  product_id: number;
  name: string;
  price: number | string;
  quantity: number;
  item_subtotal?: number | string;
}

export interface CartResponse {
  success: boolean;
  items: CartItem[];
  itemCount: number;
  cartSubtotal: string;
}
export interface VerifiedCartResponse {
  success: boolean;
  is_valid: boolean;
  message: string;
  items: {
    product_id: number;
    product_name: string;
    requested_quantity: number;
    available_stock: number;
    unit_price: string;
    has_issue: boolean;
    issue_message: string | null;
  }[];
  subtotal: string;
}



async function cartRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please log in to manage your cart.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Cart request failed.');
  }

  return data as T;
}



export async function fetchCart(): Promise<CartResponse> {
  return cartRequest<CartResponse>('/');
}


export async function addToCart(
  productId: number,
  quantity: number = 1
) {
  return cartRequest('/' , {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      quantity,
    }),
  });
}



export async function updateCartItem(
  productId: number,
  quantity: number
) {
  return cartRequest(`/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}



export async function removeCartItem(productId: number) {
  return cartRequest(`/${productId}`, {
    method: 'DELETE',
  });
}



export async function clearCart() {
  return cartRequest('/', {
    method: 'DELETE',
  });
}



export async function verifyCart(): Promise<VerifiedCartResponse> {
  return cartRequest<VerifiedCartResponse>('/verify', {
    method: 'POST',
  });
}
