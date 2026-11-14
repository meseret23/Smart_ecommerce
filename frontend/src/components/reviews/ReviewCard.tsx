
import React, { useState } from 'react';
import type { Review } from '../../services/reviewService';
import StarRating from './StarRating';
import {
  deleteReview,
  toggleReviewHelpful,
} from '../../services/reviewService';

interface ReviewCardProps {
  review: Review;
  currentUserId?: number;
  onReviewDeleted: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  onReviewDeleted,
}) => {
  const [helpfulCount, setHelpfulCount] = useState(
    Number(review.helpful_count) || 0
  );

  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUserId === review.user_id;

  const formattedDate = new Date(
    review.created_at
  ).toLocaleDateString();

  const handleHelpful = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await toggleReviewHelpful(review.id);

      setVoted(result.voted);

      setHelpfulCount((previous) =>
        result.voted
          ? previous + 1
          : Math.max(0, previous - 1)
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Could not update helpful vote.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this review?'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');

      await deleteReview(review.id);

      onReviewDeleted();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Could not delete review.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        <div>
          <h4 className="font-semibold text-gray-800">
            {review.user_name}
          </h4>

          <div className="flex items-center gap-3 mt-1">
            <StarRating
              rating={review.rating}
              size="sm"
            />

            <span className="text-xs text-gray-400">
              {formattedDate}
            </span>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {review.comment && (
        <p className="text-gray-600 text-sm leading-relaxed mt-4 whitespace-pre-wrap">
          {review.comment}
        </p>
      )}

      <div className="flex items-center gap-3 mt-5">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={loading}
          className={`text-sm font-medium transition ${
            voted
              ? 'text-blue-700'
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          {loading
            ? 'Updating...'
            : voted
              ? '✓ Helpful'
              : '👍 Helpful'}
        </button>

        <span className="text-xs text-gray-400">
          {helpfulCount} found this helpful
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-3">
          {error}
        </p>
      )}
    </article>
  );
};

export default ReviewCard;
