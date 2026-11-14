
import api from './api';

// Types
export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  helpful_count: number;
}

export interface ReviewSummary {
  average_rating: string;
  total_reviews: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReviewResponse {
  reviews: Review[];
  average_rating: string;
  total_reviews: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

// Get authentication token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// Fetch product reviews
export const getProductReviews = async (
  productId: number,
  page = 1,
  limit = 5
): Promise<ReviewResponse> => {
  const response = await api.get(
    `/products/${productId}/reviews`,
    {
      params: { page, limit },
    }
  );

  return response.data;
};

// Create or update a review
export const createProductReview = async (
  productId: number,
  review: ReviewInput
) => {
  const response = await api.post(
    `/products/${productId}/reviews`,
    review,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId: number) => {
  const response = await api.delete(
    `/products/reviews/${reviewId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// Toggle helpful vote
export const toggleReviewHelpful = async (reviewId: number) => {
  const response = await api.post(
    `/products/reviews/${reviewId}/helpful`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
// Fetch only the logged-in user's reviews for a product
export const getMyReviews = async (
  productId: number,
  page = 1,
  limit = 5
): Promise<ReviewResponse> => {
  const response = await api.get('/products/reviews/my', {
    params: {
      productId,
      page,
      limit,
    },
    headers: getAuthHeaders(),
  });

  return response.data;
};