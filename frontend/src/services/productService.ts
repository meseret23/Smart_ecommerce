export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    
    // Unpack based on your backend response structure ({ success: true, data: [...] })
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    if (json && Array.isArray(json.products)) return json.products;
    
    return [];
  } catch (err) {
    console.error('Error fetching products from backend:', err);
    return [];
  }
}