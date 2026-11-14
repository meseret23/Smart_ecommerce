
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Services
import { fetchProductById } from '../services/productService';
import type { Product } from '../services/productService';

// Review Components
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewList from '../components/reviews/ReviewList';

const BACKEND_URL = 'http://localhost:5000';

const ProductDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract product ID from the current URL.
  const id = location.pathname.match(/^\/products\/(\d+)\/?$/)?.[1];

  // ==========================================
  // STATE
  // ==========================================

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get the logged-in user's information.
  const savedUser = localStorage.getItem('user');

  let currentUserId: number | undefined;

  try {
    const user = savedUser ? JSON.parse(savedUser) : null;
    currentUserId = user?.id;
  } catch {
    currentUserId = undefined;
  }

  // ==========================================
  // FETCH PRODUCT
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async (): Promise<void> => {
      if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
        setError('Invalid product ID.');
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await fetchProductById(Number(id));

        if (!isMounted) return;

        if (!data) {
          setError('Product not found.');
          setProduct(null);
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('Failed to load product:', err);

        if (isMounted) {
          setError('Unable to load product details.');
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ==========================================
  // REVIEW REFRESH
  // ==========================================

  const handleReviewSubmitted = (): void => {
    setRefreshKey((previous) => previous + 1);
  };

  // ==========================================
  // IMAGE URL
  // ==========================================

  const imageUrl = product?.image_url
    ? product.image_url.startsWith('http')
      ? product.image_url
      : `${BACKEND_URL}${product.image_url}`
    : '';

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          Loading product details...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {error || 'Product not found.'}
        </h2>

        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
        >
          Back to Store
        </button>
      </div>
    );
  }

  // ==========================================
  // MAIN PRODUCT DETAILS
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-indigo-600 font-semibold hover:text-indigo-800 transition"
        >
          ← Back to Store
        </button>

        {/* Product Information */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Product Image */}
            <div className="bg-gray-50 rounded-2xl flex items-center justify-center min-h-[300px] overflow-hidden">

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full max-h-[450px] object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-gray-400 text-center p-10">
                  <span className="text-6xl">📦</span>
                  <p className="mt-3">No product image available</p>
                </div>
              )}

            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-center">

              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                SmartMarket Product
              </span>

              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3">
                {product.name}
              </h1>

              <p className="text-gray-600 leading-relaxed mt-5">
                {product.description || 'No description available.'}
              </p>

              {/* Price */}
              <div className="mt-7">
                <span className="text-3xl font-extrabold text-indigo-600">
                  {Number(product.price).toLocaleString()} ETB
                </span>
              </div>

              {/* Stock */}
              <div className="mt-5">
                {product.stock_quantity > 0 ? (
                  <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {product.stock_quantity} available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product ID */}
              <p className="text-xs text-gray-400 mt-6">
                Product ID: {product.id}
              </p>

            </div>
          </div>
        </section>

        {/* ==================================
            CUSTOMER REVIEWS
        ================================== */}

        <section className="mt-12">

          <div className="border-b border-gray-200 pb-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              See what customers think about this product.
            </p>
          </div>

          {/* Submit Review */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">

            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Write a Review
            </h3>

            <ReviewForm
              productId={product.id}
              onReviewSubmitted={handleReviewSubmitted}
            />

            <p className="text-xs text-gray-500 mt-4">
              Only customers who have received their orders can submit reviews.
            </p>

          </div>

          {/* Display Reviews */}
         <div className="mt-8 border-2 border-red-500 rounded-xl p-6">
  <h2 className="text-xl font-bold text-red-600">
    REVIEW LIST TEST
  </h2>

  <p>Product ID: {product.id}</p>

  <ReviewList
    productId={product.id}
    currentUserId={currentUserId}
    refreshKey={refreshKey}
  />
</div>

        </section>

      </main>
    </div>
  );
};

export default ProductDetails;
