export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
}

export async function fetchProducts(searchQuery?: string, categoryId?: number): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim() !== '') {
      params.append('search', searchQuery.trim());
    }
    if (categoryId !== undefined && categoryId > 0) {
      params.append('categoryId', categoryId.toString());
    }

    const url = `http://localhost:5000/api/products${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    
    return [];
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}