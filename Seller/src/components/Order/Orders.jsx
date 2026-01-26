import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  ShoppingCart,
  User,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getOrders(filters);
      setOrders(response.data.orders);
      
      // Calculate stats
      const total = response.data.orders.length;
      const pending = response.data.orders.filter(o => o.status === 'placed').length;
      const processing = response.data.orders.filter(o => o.status === 'processing').length;
      const completed = response.data.orders.filter(o => o.status === 'delivered').length;
      
      setStats({ total, pending, processing, completed });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) {
      return;
    }

    try {
      await sellerAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading && orders.length === 0) return <LoadingSpinner size="large" />;

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">Orders</h1>
      </div>

      <div className="orders-stats">
        <div className="stat-card-small">
          <h3>Total Orders</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card-small">
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="stat-card-small">
          <h3>Processing</h3>
          <p>{stats.processing}</p>
        </div>
        <div className="stat-card-small">
          <h3>Completed</h3>
          <p>{stats.completed}</p>
        </div>
      </div>

      <div className="orders-filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Search Order</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Order ID or customer..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {orders.length === 0 ? (
        <div className="orders-empty">
          <ShoppingCart className="empty-icon" />
          <h3 className="empty-title">No Orders Found</h3>
          <p className="empty-description">
            Orders from customers will appear here
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order._id.slice(-8)}</span>
                  <span className="order-date"> • {formatDate(order.createdAt)}</span>
                </div>
                <span className={`order-status-badge status-${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-body">
                <div className="order-customer">
                  <div className="customer-avatar">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="customer-info">
                    <h4>{order.user?.username || order.user?.email || order.shippingAddress?.name || order.delivery?.name || 'Customer'}</h4>
                    <p>{order.user?.phone || order.shippingAddress?.phone || order.delivery?.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items ({order.items.length})</h4>
                  <div className="order-items-list">
                    {order.items.map((item, index) => {
                      // Construct image URL similar to ProductDetail.jsx
                      const rawImagePath = item.product?.images?.[0];
                      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                      const serverBaseUrl = apiBaseUrl.replace('/api', '');
                      
                      let finalImageSrc = '/placeholder.png';
                      if (rawImagePath) {
                        const isBlobUrl = rawImagePath.startsWith('blob:');
                        const isFullPath = rawImagePath.startsWith('/uploads/');
                        const isAbsolute = rawImagePath.startsWith('http');
                        const isJustFilename = !rawImagePath.includes('/') && !rawImagePath.startsWith('http') && !rawImagePath.startsWith('blob:');
                        
                        if (isBlobUrl) {
                          finalImageSrc = '/placeholder.png';
                        } else if (isAbsolute) {
                          finalImageSrc = rawImagePath;
                        } else if (isFullPath) {
                          finalImageSrc = `${serverBaseUrl}${rawImagePath}`;
                        } else if (isJustFilename) {
                          finalImageSrc = `${serverBaseUrl}/uploads/${rawImagePath}`;
                        } else {
                          finalImageSrc = `${serverBaseUrl}/uploads/${rawImagePath}`;
                        }
                      }
                      
                      return (
                      <div key={index} className="order-item">
                        <img
                          src={finalImageSrc}
                          alt={item.product?.name || 'Product'}
                          className="order-item-image"
                        />
                        <div className="order-item-details">
                          <p className="order-item-name">
                            {item.product?.name || 'Unknown Product'}
                          </p>
                          <p className="order-item-meta">
                            Size: {item.size} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="order-item-price">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="order-summary">
                  <span className="order-total-label">Total Amount</span>
                  <span className="order-total-amount">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                <div className="order-actions">
                  {order.status === 'order placed' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'processing')}
                      className="btn-order btn-process"
                    >
                      <Package className="w-4 h-4" />
                      Process Order
                    </button>
                  )}
                  
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'out for delivery')}
                      className="btn-order btn-ship"
                    >
                      <Truck className="w-4 h-4" />
                      Mark as Out for Delivery
                    </button>
                  )}
                  
                  {order.status === 'out for delivery' && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'delivered')}
                      className="btn-order btn-complete"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Delivered
                    </button>
                  )}
                  
                  {(order.status === 'order placed' || order.status === 'processing') && (
                    <button
                      onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                      className="btn-order btn-cancel"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Order
                    </button>
                  )}

                  <button 
                    className="btn-order btn-view"
                    onClick={() => {
                      const customerInfo = order.user ? `${order.user.username || order.user.email || 'N/A'}${order.user.phone ? ` (${order.user.phone})` : ''}` : (order.shippingAddress?.name || order.delivery?.name || 'N/A');
                      alert(`Order Details:\n\nOrder ID: ${order._id}\nStatus: ${order.status}\nCustomer: ${customerInfo}\nTotal: ${formatCurrency(order.totalAmount)}\nItems: ${order.items.length}\nDate: ${formatDate(order.createdAt)}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;