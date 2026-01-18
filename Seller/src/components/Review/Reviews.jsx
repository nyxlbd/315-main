import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rating: '',
    search: '',
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getReviews(filters);
      setReviews(response.data.reviews);
      
      // Calculate stats
      const total = response.data.reviews.length;
      const sum = response.data.reviews.reduce((acc, r) => acc + r.rating, 0);
      const average = total > 0 ? (sum / total).toFixed(1) : 0;
      
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      response.data.reviews.forEach(r => {
        breakdown[r.rating]++;
      });
      
      setStats({ average, total, breakdown });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      await sellerAPI.replyToReview(reviewId, { reply: replyText });
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit reply');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className="w-4 h-4"
        fill={index < rating ? '#fbbf24' : 'none'}
        stroke={index < rating ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  if (loading && reviews.length === 0) return <LoadingSpinner size="large" />;

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h1 className="reviews-title">Customer Reviews</h1>
      </div>

      <div className="reviews-stats">
        <div className="reviews-rating-card">
          <div className="rating-overview">
            <div className="rating-score">{stats.average}</div>
            <div className="rating-details">
              <div className="rating-stars">{renderStars(Math.round(stats.average))}</div>
              <p className="rating-count">Based on {stats.total} reviews</p>
            </div>
          </div>

          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="rating-bar-row">
                <span className="rating-bar-label">{star}★</span>
                <div className="rating-bar-container">
                  <div
                    className="rating-bar-fill"
                    style={{
                      width: `${stats.total > 0 ? (stats.breakdown[star] / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="rating-bar-count">{stats.breakdown[star]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reviews-rating-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
            Response Rate
          </h3>
          <div className="rating-score">
            {reviews.length > 0
              ? Math.round((reviews.filter((r) => r.sellerReply).length / reviews.length) * 100)
              : 0}
            %
          </div>
          <p className="rating-count">
            {reviews.filter((r) => r.sellerReply).length} of {reviews.length} reviews replied
          </p>
        </div>

        <div className="reviews-rating-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
            Recent Activity
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Last 7 days: {reviews.filter((r) => {
              const reviewDate = new Date(r.createdAt);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return reviewDate > weekAgo;
            }).length} reviews
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Last 30 days: {reviews.filter((r) => {
              const reviewDate = new Date(r.createdAt);
              const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              return reviewDate > monthAgo;
            }).length} reviews
          </p>
        </div>
      </div>

      <div className="reviews-filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Search Reviews</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by product or customer..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Rating</label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchReviews} />}

      {reviews.length === 0 ? (
        <div className="reviews-empty">
          <Star className="empty-icon" />
          <h3 className="empty-title">No Reviews Yet</h3>
          <p className="empty-description">
            Customer reviews will appear here once you receive them
          </p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="review-user">
                  <div className="review-avatar">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="review-user-info">
                    <h4>{review.user?.username || 'Anonymous'}</h4>
                    <p>{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="review-rating">{renderStars(review.rating)}</div>
              </div>

              <div className="review-product">
                <img
                  src={review.product?.images?.[0] || '/placeholder.png'}
                  alt={review.product?.name || 'Product'}
                  className="review-product-image"
                />
                <span className="review-product-name">
                  {review.product?.name || 'Unknown Product'}
                </span>
              </div>

              {review.comment && (
                <p className="review-content">{review.comment}</p>
              )}

              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review ${index + 1}`}
                      className="review-image"
                    />
                  ))}
                </div>
              )}

              {review.sellerReply ? (
                <div className="review-reply">
                  <div className="review-reply-header">
                    <MessageSquare className="w-4 h-4" />
                    Seller Response
                  </div>
                  <p className="review-reply-content">{review.sellerReply}</p>
                </div>
              ) : replyingTo === review._id ? (
                <div className="review-reply-form">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your response..."
                    className="reply-textarea"
                  />
                  <div className="review-actions">
                    <button
                      onClick={() => handleReplySubmit(review._id)}
                      disabled={!replyText.trim()}
                      className="btn-submit-reply"
                    >
                      <Send className="w-4 h-4" />
                      Submit Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="btn-cancel-reply"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="review-actions">
                  <button
                    onClick={() => setReplyingTo(review._id)}
                    className="btn-reply"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply to Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;