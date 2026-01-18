import React, { useEffect, useState } from 'react';
import API from '../api';
import ReviewReplyForm from '../components/ReviewReplyForm';

function SellerReviews() {
  const [products, setProducts] = useState([]);
  const [reviewsByProduct, setReviewsByProduct] = useState({}); // {productId: [reviews]}
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState({}); // {reviewId: true/false}
  const [replyLoading, setReplyLoading] = useState({}); // {reviewId: true/false}

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const res = await API.get('/products?mine=1');
      const productsData = Array.isArray(res.data) ? res.data : [];
      setProducts(productsData);
      const reviewsMap = {};
      for (const p of productsData) {
        try {
          const rres = await API.get(`/reviews/product/${p._id}`);
          const reviewsData = Array.isArray(rres.data) ? rres.data : [];
          if (reviewsData.length > 0) {
            reviewsMap[p._id] = reviewsData;
          }
        } catch {}
      }
      setReviewsByProduct(reviewsMap);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleReply = async (reviewId, productId, replyText) => {
    setReplyLoading(r => ({ ...r, [reviewId]: true }));
    try {
      await API.patch(`/reviews/${reviewId}/reply`, { reply: replyText });
      // Refresh reviews for this product
      const rres = await API.get(`/reviews/product/${productId}`);
      const reviewsData = Array.isArray(rres.data) ? rres.data : [];
      setReviewsByProduct(prev => ({ ...prev, [productId]: reviewsData }));
      setReplying(r => ({ ...r, [reviewId]: false }));
    } catch {
      alert('Failed to submit reply.');
    }
    setReplyLoading(r => ({ ...r, [reviewId]: false }));
  };

  return (
    <div>
      <h2>Product Reviews</h2>
      {loading ? <div>Loading reviews...</div> : null}
      {!loading && Object.keys(reviewsByProduct).length === 0 && <div>No reviews for your products yet.</div>}
      {!loading && Object.entries(reviewsByProduct).map(([productId, reviews]) => {
        const product = Array.isArray(products) ? products.find(p => p._id === productId) : null;
        const reviewsArray = Array.isArray(reviews) ? reviews : [];
        return (
          <div key={productId} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginBottom: 8 }}>{product?.name || 'Product'}</h3>
            {reviewsArray.map(review => (
              <div key={review._id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fafafa', marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', color: '#4b7c54' }}>Rating: {review.rating} / 5</div>
                <div style={{ margin: '4px 0' }}>{review.comment}</div>
                <div style={{ fontSize: '0.95em', color: '#666' }}>By: {review.client?.name || 'Client'} on {new Date(review.createdAt).toLocaleDateString()}</div>
                {review.reply && (
                  <div style={{ marginTop: 6, padding: 8, background: '#f6fff6', border: '1px solid #b6e2b6', borderRadius: 6 }}>
                    <strong>Seller Reply:</strong> {review.reply}
                  </div>
                )}
                {!review.reply && (
                  replying[review._id] ? (
                    <ReviewReplyForm
                      reviewId={review._id}
                      loading={replyLoading[review._id]}
                      onSubmit={replyText => handleReply(review._id, productId, replyText)}
                      onCancel={() => setReplying(r => ({ ...r, [review._id]: false }))}
                    />
                  ) : (
                    <button
                      style={{ marginTop: 8, background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 1rem', cursor: 'pointer' }}
                      onClick={() => setReplying(r => ({ ...r, [review._id]: true }))}
                    >
                      Reply
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default SellerReviews;
