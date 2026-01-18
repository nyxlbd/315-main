import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Search, Store, Package, TrendingUp } from 'lucide-react';
import './Users.css';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllSellers();
      console.log('Sellers response:', response.data);
      setSellers(response.data.sellers || []);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError(err.response?.data?.message || 'Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchSellers} />;

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1 className="page-title">Sellers Management</h1>
          <p className="page-subtitle">Manage all sellers and their shops</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <Store />
          </div>
          <div>
            <h3>Total Sellers</h3>
            <p className="stat-number">{sellers.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Package />
          </div>
          <div>
            <h3>Total Products</h3>
            <p className="stat-number">
              {sellers.reduce((sum, s) => sum + (s.productsCount || 0), 0)}
            </p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div>
            <h3>Active Sellers</h3>
            <p className="stat-number">
              {sellers.filter(s => s.isActive).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search sellers by name, email, or shop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Sellers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Email</th>
              <th>Shop Name</th>
              <th>Products</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  {searchTerm ? 'No sellers match your search' : 'No sellers found'}
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller) => (
                <tr key={seller._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {seller.username?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <span className="user-name">{seller.username}</span>
                    </div>
                  </td>
                  <td>{seller.email}</td>
                  <td>{seller.shopName || 'No shop name'}</td>
                  <td>
                    <span className="product-count">
                      {seller.productsCount || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${seller.isActive ? 'success' : 'danger'}`}>
                      {seller.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(seller.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sellers;
