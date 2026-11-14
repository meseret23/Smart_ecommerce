
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category?: string;
  category_id?: number;
  seller_id?: number;
  image_url?: string;
  created_at?: string;
}

// ==========================================
// FETCH ALL PRODUCTS
// ==========================================

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:5000/api/products');

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    // Support different backend response structures.
    if (Array.isArray(json)) {
      return json;
    }

    if (Array.isArray(json?.data)) {
      return json.data;
    }

    if (Array.isArray(json?.products)) {
      return json.products;
    }

    return [];
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

// ==========================================
// FETCH ONE PRODUCT BY ID
// ==========================================

export async function fetchProductById(
  id: number
): Promise<Product | null> {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid product ID.');
    }

    const res = await fetch(
      `http://localhost:5000/api/products/${id}`
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }

      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    // Extract product from the backend response.
    const product = json?.data ?? json?.product ?? json;

    // Make sure the response contains a valid product ID.
    if (
      !product ||
      typeof product.id !== 'number' ||
      typeof product.name !== 'string'
    ) {
      throw new Error('Invalid product response from server.');
    }

    return product as Product;

  } catch (err) {
    console.error('Error fetching product:', err);
    return null;
  }
}
