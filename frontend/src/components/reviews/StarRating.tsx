
import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRatingChange?.(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`
            ${sizeClasses[size]}
            transition-colors
            ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          `}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
