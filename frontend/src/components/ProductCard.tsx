
import React, { useEffect, useState } from 'react';
import type { Product } from '../services/productService';
import { getProductReviews } from '../services/reviewService';
import type { Review } from '../services/reviewService';

interface ProductCardProps {
  product: Product;
}

interface ReviewData {
  average_rating: string;
  total_reviews: number;
  reviews: Review[];
}

const BACKEND_URL = 'http://localhost:5000';

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [reviewData, setReviewData] = useState<ReviewData>({
    average_rating: '0',
    total_reviews: 0,
    reviews: [],
  });

  const [reviewsLoading, setReviewsLoading] = useState(true);

  // All reviews modal state
  const [showReviews, setShowReviews] = useState(false);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const imageUrl = product.image_url || (product as any).imageUrl;

  const imageSrc = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : `${BACKEND_URL}${imageUrl}`
    : '';

  // Load two recent reviews for the product card
  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      try {
        const data = await getProductReviews(product.id, 1, 2);

        if (isMounted) {
          setReviewData({
            average_rating: data.average_rating,
            total_reviews: data.total_reviews,
            reviews: data.reviews || [],
          });
        }
      } catch (error) {
        console.error(
          `Could not load reviews for product ${product.id}:`,
          error
        );
      } finally {
        if (isMounted) {
          setReviewsLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Load reviews for the modal, five at a time
  useEffect(() => {
    if (!showReviews) return;

    let isMounted = true;

    const loadAllReviews = async () => {
      setModalLoading(true);
      setModalError('');

      try {
        const data = await getProductReviews(product.id, reviewsPage, 5);

        if (isMounted) {
          setAllReviews(data.reviews || []);
          setTotalPages(data.total_pages || 1);
        }
      } catch (error) {
        if (isMounted) {
          setModalError('Could not load reviews. Please try again.');
        }
        console.error('Could not load all reviews:', error);
      } finally {
        if (isMounted) {
          setModalLoading(false);
        }
      }
    };

    void loadAllReviews();

    return () => {
      isMounted = false;
    };
  }, [showReviews, product.id, reviewsPage]);

  const averageRating = Number(reviewData.average_rating) || 0;

  const openReviews = () => {
    setReviewsPage(1);
    setShowReviews(true);
  };

  return (
    <>
      <article className="group h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

        {/* Product Image */}
        <div className="relative h-36 bg-gray-50 overflow-hidden shrink-0">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <span className="text-4xl">📦</span>
            </div>
          )}

          <span className="absolute top-2 left-2 bg-white/95 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.category || 'General'}
          </span>
        </div>

        {/* Product Information */}
        <div className="p-3 flex flex-col flex-1 min-h-0">

          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {product.description || 'No description available.'}
          </p>

          {/* Rating Summary */}
          <div className="mt-2 flex items-center gap-2 shrink-0">
            {reviewsLoading ? (
              <span className="text-[10px] text-gray-400">
                Loading ratings...
              </span>
            ) : reviewData.total_reviews > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                </div>

                <span className="text-xs text-gray-400">
                  ({reviewData.total_reviews} reviews)
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">
                No reviews yet
              </span>
            )}
          </div>

          {/* Customer Comments */}
          <div className="mt-2 border-t border-gray-100 pt-2 h-[160px] overflow-hidden shrink-0 flex flex-col">

            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 shrink-0">
              Recent Customer Feedback
            </h4>

            <div className="space-y-2 overflow-hidden flex-1">
              {reviewData.reviews.length > 0 ? (
                reviewData.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 rounded-lg p-2 h-[58px] overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                        {review.user_name}
                      </span>

                      <span className="text-yellow-400 text-xs shrink-0">
                        {'★'.repeat(review.rating)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 line-clamp-1 break-words">
                      {review.comment || 'Rated this product.'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Be the first to share your experience!
                </p>
              )}
            </div>

            {reviewData.total_reviews > 0 && (
              <button
                type="button"
                onClick={openReviews}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold text-left mt-2 shrink-0"
              >
                View all {reviewData.total_reviews} reviews →
              </button>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block">
                Price
              </span>

              <span className="text-lg font-extrabold text-indigo-700">
                {Number(product.price).toLocaleString()} ETB
              </span>
            </div>

            {product.stock_quantity > 0 ? (
              <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-1.5 rounded-full">
                In Stock
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-1.5 rounded-full">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </article>

      {/* All Reviews Modal */}
      {showReviews && (
        <div
          className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowReviews(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reviews-modal-title"
            className="bg-white w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2
                  id="reviews-modal-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Customer Reviews
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {product.name} · {reviewData.total_reviews} reviews
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviews(false)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
                aria-label="Close reviews"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {modalLoading ? (
                <p className="text-center text-sm text-gray-500 py-10">
                  Loading reviews...
                </p>
              ) : modalError ? (
                <p className="text-center text-sm text-red-500 py-10">
                  {modalError}
                </p>
              ) : allReviews.length > 0 ? (
                <div className="space-y-4">
                  {allReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {review.user_name}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <span className="text-yellow-400 text-sm shrink-0">
                          {'★'.repeat(review.rating)}
                          <span className="text-gray-300">
                            {'☆'.repeat(5 - review.rating)}
                          </span>
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap break-words">
                        {review.comment || 'Rated this product.'}
                      </p>

                      <p className="text-xs text-gray-400 mt-3">
                        👍 {review.helpful_count ?? 0} found this helpful
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-10">
                  No reviews found.
                </p>
              )}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={reviewsPage <= 1 || modalLoading}
                onClick={() => setReviewsPage((page) => page - 1)}
                className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-xs text-gray-500">
                Page {reviewsPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={reviewsPage >= totalPages || modalLoading}
                onClick={() => setReviewsPage((page) => page + 1)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
