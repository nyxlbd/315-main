import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(data.totalUsers || 0),
      icon: Users,
      color: '#3b82f6',
      change: '+12%',
      isPositive: true,
    },
    {
      title: 'Active Sellers',
      value: formatNumber(data.totalSellers || 0),
      icon: Store,
      color: '#8b5cf6',
      change: '+8%',
      isPositive: true,
    },
    {
      title: 'Total Products',
      value: formatNumber(data.totalProducts || 0),
      icon: Package,
      color: '#f59e0b',
      change: '+23%',
      isPositive: true,
    },
    {
      title: 'Total Orders',
      value: formatNumber(data.totalOrders || 0),
      icon: ShoppingCart,
      color: '#10b981',
      change: '+15%',
      isPositive: true,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue || 0),
      icon: DollarSign,
      color: '#06b6d4',
      change: '+18%',
      isPositive: true,
    },
  ];

  const revenueData = data.revenueChart || [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 19000 },
    { month: 'Mar', revenue: 15000 },
    { month: 'Apr', revenue: 25000 },
    { month: 'May', revenue: 22000 },
    { month: 'Jun', revenue: 30000 },
  ];

  const categoryData = data.categoryStats || [
    { name: 'Handicrafts', value: 400 },
    { name: 'Textiles', value: 300 },
    { name: 'Jewelry', value: 200 },
    { name: 'Home Decor', value: 150 },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">Welcome to PMC Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon style={{ color: stat.color }} />
              </div>
              <div className="stat-change" style={{ color: stat.isPositive ? '#10b981' : '#ef4444' }}>
                {stat.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h3 className="section-title">Recent Orders</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentOrders || []).map((order, index) => (
                <tr key={index}>
                  <td>#{order.id || index + 1}</td>
                  <td>{order.customer || 'N/A'}</td>
                  <td>{order.product || 'N/A'}</td>
                  <td>{formatCurrency(order.amount || 0)}</td>
                  <td>
                    <span className={`badge badge-${order.status === 'delivered' ? 'success' : 'warning'}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td>{order.date || 'N/A'}</td>
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
