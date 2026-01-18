import React, { useState } from 'react';

function ReviewForm({ orderId, productId, onSubmit, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ order: orderId, product: productId, rating, comment });
    } catch (err) {
      setError('Failed to submit review.');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fafafa' }}>
      <div style={{ marginBottom: 8 }}>
        <label><strong>Rating:</strong> </label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} disabled={submitting}>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><strong>Comment:</strong> </label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ width: '100%' }} disabled={submitting} />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <button type="submit" disabled={submitting} style={{ background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', marginRight: 8 }}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
      <button type="button" onClick={onCancel} disabled={submitting} style={{ background: '#ccc', color: '#222', border: 'none', borderRadius: 6, padding: '0.4rem 1rem' }}>
        Cancel
      </button>
    </form>
  );
}

export default ReviewForm;
