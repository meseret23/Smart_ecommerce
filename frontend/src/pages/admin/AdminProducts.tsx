
import { useEffect, useState, type FormEvent } from "react";
import { useRef } from "react";


const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category_id?: number | null;
  image_url?: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category_id: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  category_id: "",
  image_url: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>("");

const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: requestHeaders,
      });

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();

      // Supports either an array or an object containing products.
      const productList = Array.isArray(data)
        ? data
        : data.products || data.data || [];

      setProducts(productList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  
  }, []);

  const updateField = (field: keyof ProductForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError("");
  setSuccess("");

  if (!form.name.trim() || !form.price || form.stock_quantity === "") {
    setError("Please complete the product name, price, and stock.");
    return;
  }

  const price = Number(form.price);
  const stock = Number(form.stock_quantity);

  if (
    price < 0 ||
    stock < 0 ||
    !Number.isFinite(price) ||
    !Number.isFinite(stock)
  ) {
    setError("Price and stock must be valid non-negative numbers.");
    return;
  }

  try {
    setSaving(true);

    // Create multipart form data
    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("price", String(price));
    formData.append("stock_quantity", String(stock));

    if (form.category_id) {
      formData.append("category_id", String(Number(form.category_id)));
    }

    // Attach the actual image file
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    const url = editingId
      ? `${API_BASE_URL}/products/${editingId}`
      : `${API_BASE_URL}/products`;

    // Do not manually set Content-Type for FormData
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: {
        Authorization: requestHeaders.Authorization,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || "Could not save product.");
    }

    setSuccess(
      editingId
        ? "Product updated successfully."
        : "Product added successfully."
    );

    resetForm();
    await loadProducts();

  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setSaving(false);
  }
};
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Image size must be less than 5 MB.");
    return;
  }

  setError("");
  setSelectedImage(file);

  const previewUrl = URL.createObjectURL(file);
  setImagePreview(previewUrl);
};

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        stock_quantity: String(product.stock_quantity),
        category_id: String(product.category_id || ""),
        image_url: product.image_url || "",
    });
};

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: requestHeaders,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not delete product.");
      }

      setProducts((previous) =>
        previous.filter((product) => product.id !== id)
      );

      setSuccess("Product deleted successfully.");

      if (editingId === id) resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Product Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Add, edit, search, and manage store products.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Add / Edit Product Form */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {editingId ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Product name *</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border p-2.5"
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Price *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full rounded-lg border p-2.5"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Stock quantity *</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={(e) => updateField("stock_quantity", e.target.value)}
              className="w-full rounded-lg border p-2.5"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category ID</label>
            <input
              type="number"
              min="1"
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
              className="w-full rounded-lg border p-2.5"
              placeholder="Category ID"
            />
          </div>

<div className="md:col-span-2">
  <label className="mb-2 block text-sm font-medium">
    Product Image
  </label>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
  />

  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    className="rounded-lg border px-4 py-2.5 hover:bg-gray-50"
  >
    Choose Image
  </button>

  {imagePreview && (
    <div className="mt-3">
      <img
        src={imagePreview}
        alt="Product preview"
        className="h-40 w-40 rounded-lg border object-cover"
      />
      <p className="mt-2 text-sm text-gray-600">
        {selectedImage?.name}
      </p>
    </div>
  )}
</div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border p-2.5"
              rows={3}
              placeholder="Describe the product..."
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Add Product"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-2.5 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Product List */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              All Products
            </h2>
            <p className="text-sm text-gray-500">
              {products.length} products in the catalog
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="rounded-lg border p-2.5 sm:w-64"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No products found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Category ID</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No img
                          </div>
                        )}
                        <span className="font-medium text-gray-800">
                          {product.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-3">
                      {Number(product.price).toLocaleString()}
                    </td>
                    <td className="p-3">{product.stock_quantity}</td>
                    <td className="p-3">{product.category_id ?? "—"}</td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

