import React, { useEffect, useState } from 'react';
import API from '../api';

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders/seller/all');
      const ordersData = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to fetch orders.');
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders => orders.map(order => order._id === orderId ? { ...order, status } : order));
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  return (
    <div className="container">
      <h2>Client Orders</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (!Array.isArray(orders) || orders.length === 0) && <div>No orders found.</div>}
      {!loading && !error && Array.isArray(orders) && orders.length > 0 && (
        <div>
          {orders.map(order => (
            <div key={order._id} style={{ border: '1px solid #ccc', borderRadius: 8, marginBottom: 20, padding: 16 }}>
              <div><strong>Order ID:</strong> {order._id}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>Total:</strong> ${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</div>
              <div><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</div>
              <div><strong>Delivery:</strong> {order.delivery?.name}, {order.delivery?.address}, {order.delivery?.phone}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Items:</strong>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.product?.name || 'Product'}
                      {item.size ? ` (${item.size})` : ''}
                      {item.variation ? ` [${item.variation}]` : ''}
                      &nbsp;- Qty: {item.quantity} @ ${item.price}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  Update Status:
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order._id, e.target.value)}
                    style={{ marginLeft: 8 }}
                    disabled={order.status === 'delivered'}
                  >
                    <option value="order placed">Order Placed</option>
                    <option value="order packed">Order Packed</option>
                    <option value="in transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
