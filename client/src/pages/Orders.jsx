
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ReviewForm from '../components/ReviewForm';
import './Orders.css';


function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState({}); // { orderId: { [productId]: review } }
  const [showReviewForm, setShowReviewForm] = useState({}); // { [orderId_productId]: true }


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders/my');
      const ordersData = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);
      // For delivered orders, fetch reviews for each product in the order
      const delivered = ordersData.filter(order => order.status === 'delivered');
      let reviewMap = {};
      for (const order of delivered) {
        for (const item of order.items) {
          try {
            const rres = await API.get(`/reviews/product/${item.product._id}`);
            // Find review for this order and product by this client
            const review = rres.data.find(r => r.order === order._id);
            if (review) {
              if (!reviewMap[order._id]) reviewMap[order._id] = {};
              reviewMap[order._id][item.product._id] = review;
            }
          } catch {}
        }
      }
      setReviews(reviewMap);
    } catch (err) {
      setError('Failed to fetch orders.');
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchOrders();
    // Removed automatic polling to avoid disrupting review submission
  }, []);


  return (
    <div className="container">
      <h2>Order History</h2>
      <button onClick={fetchOrders} className="orders-refresh-btn">Refresh</button>
      {loading && <div>Loading...</div>}
      {error && <div className="orders-error">{error}</div>}
      {!loading && !error && (!Array.isArray(orders) || orders.length === 0) && <div>No orders found.</div>}
      {!loading && !error && Array.isArray(orders) && orders.length > 0 && (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="orders-order">
              <div><strong>Order ID:</strong> {order._id}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>Total:</strong> ${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</div>
              <div><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</div>
              <div><strong>Delivery:</strong> {order.delivery?.name}, {order.delivery?.address}, {order.delivery?.phone}</div>
              <div className="orders-items-list">
                <strong>Items:</strong>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.product?.name || 'Product'}
                      {item.size ? ` (${item.size})` : ''}
                      {item.variation ? ` [${item.variation}]` : ''}
                      &nbsp;- Qty: {item.quantity} @ ${item.price}
                      {/* Review logic for delivered orders */}
                      {order.status === 'delivered' && item.product?._id && (
                        <div>
                          {reviews[order._id]?.[item.product._id] ? (
                            <div className="orders-review-box">
                              <strong>Your Review:</strong> <br />
                              <span>Rating: {reviews[order._id][item.product._id].rating} / 5</span><br />
                              <span>Comment: {reviews[order._id][item.product._id].comment}</span>
                              {reviews[order._id][item.product._id].reply && (
                                <div className="orders-review-reply">
                                  <strong>Seller Reply:</strong> {reviews[order._id][item.product._id].reply}
                                </div>
                              )}
                            </div>
                          ) : (
                            showReviewForm[`${order._id}_${item.product._id}`] ? (
                              <ReviewForm
                                orderId={order._id}
                                productId={item.product._id}
                                onSubmit={async (data) => {
                                  await API.post('/reviews', data);
                                  setShowReviewForm(f => ({ ...f, [`${order._id}_${item.product._id}`]: false }));
                                  fetchOrders();
                                }}
                                onCancel={() => setShowReviewForm(f => ({ ...f, [`${order._id}_${item.product._id}`]: false }))}
                              />
                            ) : (
                              <button
                                style={{ marginTop: 6, background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.95rem', cursor: 'pointer' }}
                                onClick={() => setShowReviewForm(f => ({ ...f, [`${order._id}_${item.product._id}`]: true }))}
                              >Leave a Review</button>
                            )
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {order.status === 'in transit' && (
                <button
                  style={{ marginTop: 12, background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', cursor: 'pointer' }}
                  onClick={async () => {
                    try {
                      await API.patch(`/orders/${order._id}/mark-delivered`);
                      fetchOrders();
                    } catch (err) {
                      alert('Failed to mark as delivered.');
                    }
                  }}
                >Mark as Delivered</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
