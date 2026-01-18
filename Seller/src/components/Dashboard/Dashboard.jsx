import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  AlertTriangle,
  PackageX,
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getDashboard();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const { analytics, productsByCategory, recentOrders, lowStockProducts, outOfStockProducts, salesByMonth } = data;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's your shop overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{analytics.totalProducts}</p>
            </div>
            <div className="stat-icon-wrapper stat-icon-blue">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-label">Total Orders</p>
              <p className="stat-value">{analytics.totalOrders}</p>
              <p className="stat-subtext">{analytics.pendingOrders} pending</p>
            </div>
            <div className="stat-icon-wrapper stat-icon-green">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(analytics.totalRevenue)}</p>
              <p className="stat-subtext">{analytics.deliveredOrders} delivered</p>
            </div>
            <div className="stat-icon-wrapper stat-icon-yellow">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-label">Average Rating</p>
              <p className="stat-value">{analytics.averageRating || 0} ⭐</p>
              <p className="stat-subtext">{analytics.totalReviews} reviews</p>
            </div>
            <div className="stat-icon-wrapper stat-icon-purple">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h2 className="chart-title">Sales Overview (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="_id.month" 
                tickFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Products by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productsByCategory}
                dataKey="count"
                nameKey="category.name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {productsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="inventory-grid">
        <div className="inventory-card">
          <div className="inventory-header">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h2 className="inventory-title">Low Stock Products</h2>
          </div>
          <div className="inventory-body">
            {lowStockProducts.length === 0 ? (
              <p className="inventory-empty">No low stock products</p>
            ) : (
              <div className="inventory-list">
                {lowStockProducts.map((product) => {
                  const imageUrl = product.images[0] || '/placeholder.png';
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  const serverBaseUrl = apiUrl.replace('/api', '');
                  const isBlobUrl = imageUrl.startsWith('blob:');
                  const isRelative = imageUrl.startsWith('/') && !imageUrl.startsWith('http');
                  const finalImageUrl = isBlobUrl 
                    ? '/placeholder.png' 
                    : (isRelative ? `${serverBaseUrl}${imageUrl}` : imageUrl);
                  
                  return (
                  <div key={product._id} className="inventory-item inventory-item-warning">
                    <div className="inventory-item-content">
                      <img
                        src={finalImageUrl}
                        alt={product.name}
                        className="inventory-item-image"
                      />
                      <div className="inventory-item-info">
                        <p className="inventory-item-name">{product.name}</p>
                        <p className="inventory-item-stock inventory-item-stock-warning">
                          Stock: {product.totalStock}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="inventory-card">
          <div className="inventory-header">
            <PackageX className="w-5 h-5 text-red-600" />
            <h2 className="inventory-title">Out of Stock</h2>
          </div>
          <div className="inventory-body">
            {outOfStockProducts.length === 0 ? (
              <p className="inventory-empty">All products in stock!</p>
            ) : (
              <div className="inventory-list">
                {outOfStockProducts.map((product) => {
                  const imageUrl = product.images[0] || '/placeholder.png';
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  const serverBaseUrl = apiUrl.replace('/api', '');
                  const isBlobUrl = imageUrl.startsWith('blob:');
                  const isRelative = imageUrl.startsWith('/') && !imageUrl.startsWith('http');
                  const finalImageUrl = isBlobUrl 
                    ? '/placeholder.png' 
                    : (isRelative ? `${serverBaseUrl}${imageUrl}` : imageUrl);
                  
                  return (
                  <div key={product._id} className="inventory-item inventory-item-danger">
                    <div className="inventory-item-content">
                      <img
                        src={finalImageUrl}
                        alt={product.name}
                        className="inventory-item-image"
                      />
                      <div className="inventory-item-info">
                        <p className="inventory-item-name">{product.name}</p>
                        <p className="inventory-item-stock inventory-item-stock-danger">
                          Out of stock
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="orders-card">
        <div className="orders-header">
          <h2 className="orders-title">Recent Orders</h2>
        </div>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td className="order-id">#{order._id.slice(-8)}</td>
                  <td>{order.user?.username || 'N/A'}</td>
                  <td>{order.items.length} item(s)</td>
                  <td className="order-id">{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <span className={`order-status ${
                      order.status === 'delivered' ? 'status-delivered' :
                      order.status === 'processing' ? 'status-processing' :
                      order.status === 'out for delivery' ? 'status-delivery' :
                      'status-placed'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
