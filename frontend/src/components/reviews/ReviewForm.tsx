
import React, { useState } from 'react';
import StarRating from '../reviews/StarRating';
import {
  createProductReview,
} from '../../services/reviewService';

interface ReviewFormProps {
  productId: number;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }

    try {
      setLoading(true);

      await createProductReview(productId, {
        rating,
        comment: comment.trim(),
      });

      setSuccess('Your review was submitted successfully!');
      setRating(0);
      setComment('');

      onReviewSubmitted();

    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Unable to submit your review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5"
    >
      <h3 className="text-xl font-semibold text-gray-800">
        Write a Review
      </h3>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </p>

        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Review
        </label>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={1000}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />

        <p className="text-xs text-gray-400 text-right mt-1">
          {comment.length}/1000
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-3 rounded-lg transition"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
