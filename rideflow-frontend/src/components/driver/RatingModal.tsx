import React, { useState } from 'react';
import { Star, X, MessageCircle } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: number;
  riderName: string;
  onSubmit: (rating: { score: number; comment?: string }) => void;
  isLoading?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  riderName,
  onSubmit,
  isLoading = false
}) => {
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) return;
    
    onSubmit({ score, comment: comment.trim() || undefined });
    setScore(0);
    setComment('');
    onClose();
  };

  const StarButton = ({ starValue }: { starValue: number }) => (
    <button
      type="button"
      className="p-1 transition-colors"
      onMouseEnter={() => setHoveredStar(starValue)}
      onMouseLeave={() => setHoveredStar(0)}
      onClick={() => setScore(starValue)}
    >
      <Star
        className={`w-8 h-8 transition-colors ${
          starValue <= (hoveredStar || score)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Rate Your Rider</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              How was your ride with <span className="font-medium">{riderName}</span>?
            </p>
            
            <div className="flex gap-1 justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarButton key={star} starValue={star} />
              ))}
            </div>
            
            <div className="text-center text-sm text-gray-500">
              {score === 1 && 'Poor'}
              {score === 2 && 'Fair'}
              {score === 3 && 'Good'}
              {score === 4 && 'Very Good'}
              {score === 5 && 'Excellent'}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4" />
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this rider..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={score === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
