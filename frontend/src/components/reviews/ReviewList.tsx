
import React, { useCallback, useEffect, useState } from 'react';
import {
  getProductReviews,getMyReviews,
  type Review,
  type ReviewResponse,
} from '../../services/reviewService';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  productId: number;
  currentUserId?: number;
  refreshKey?: number;
   myOnly?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  productId,
  currentUserId,
  refreshKey = 0,
   myOnly = false,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading reviews for product:', productId);

      const data = myOnly
  ? await getMyReviews(productId, page, 5)
  : await getProductReviews(productId, page, 5);

      console.log('Reviews API response:', data);
      console.log('Reviews array:', data.reviews);

      if (!data || !Array.isArray(data.reviews)) {
        throw new Error('Invalid reviews response from server.');
      }

      setReviews(data.reviews);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Could not load product reviews.'
      );

      setReviews([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, refreshKey]);

  const handleReviewDeleted = () => {
    void loadReviews();
  };

  if (loading) {
    return (
      <p className="py-6 text-center text-gray-500">
        Loading reviews...
      </p>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-red-500">{error}</p>

        <button
          onClick={() => void loadReviews()}
          className="mt-2 rounded bg-gray-800 px-4 py-2 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Customer Reviews
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold">
            {Number(summary?.average_rating || 0).toFixed(1)}
          </span>

          <div>
            <p className="text-yellow-500">
              ★ Average rating
            </p>

            <p className="text-sm text-gray-500">
              {summary?.total_reviews || 0} reviews
            </p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="py-6 text-gray-500">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onReviewDeleted={handleReviewDeleted}
            />
          ))}
        </div>
      )}

      {summary && summary.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((previous) => previous - 1)}
            className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {summary.page} of {summary.total_pages}
          </span>

          <button
            disabled={page >= summary.total_pages}
            onClick={() => setPage((previous) => previous + 1)}
            className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ReviewList;
