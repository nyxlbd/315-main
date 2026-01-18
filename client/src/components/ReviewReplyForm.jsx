import React, { useState } from 'react';

function ReviewReplyForm({ reviewId, onSubmit, onCancel, loading }) {
  const [reply, setReply] = useState('');

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(reply);
      }}
      style={{ marginTop: 8 }}
    >
      <textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        rows={2}
        style={{ width: '100%', borderRadius: 4, border: '1px solid #ccc', padding: 6 }}
        placeholder="Write a reply to this review..."
        required
      />
      <div style={{ marginTop: 4 }}>
        <button
          type="submit"
          disabled={loading || !reply.trim()}
          style={{ background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 1rem', marginRight: 8, cursor: 'pointer' }}
        >
          {loading ? 'Replying...' : 'Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: '#ccc', color: '#222', border: 'none', borderRadius: 6, padding: '0.3rem 1rem', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ReviewReplyForm;
