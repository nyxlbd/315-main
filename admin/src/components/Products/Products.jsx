import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Search, Filter, Check, X, Trash2, RefreshCw } from 'lucide-react';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingProductId, setRejectingProductId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllProducts({ status: filterStatus !== 'all' ? filterStatus : undefined });
      console.log('Products fetched:', response.data.products);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    if (!window.confirm('Are you sure you want to approve this product?')) return;

    try {
      setProcessingId(productId);
      const response = await adminAPI.approveProduct(productId);
      console.log('Approve response:', response.data);
      
      // Update the product in the local state immediately
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId 
            ? { ...p, status: 'approved', isAvailable: true }
            : p
        )
      );
      
      alert('✅ Product approved successfully!');
      
      // Also refresh from server to ensure consistency
      await fetchProducts();
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.response?.data?.message || 'Failed to approve product');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (productId) => {
    setRejectingProductId(productId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      alert('⚠️ Rejection reason is required');
      return;
    }

    const productId = rejectingProductId;
    try {
      setProcessingId(productId);
      setShowRejectModal(false);
      const response = await adminAPI.rejectProduct(productId, rejectionReason);
      console.log('Reject response:', response.data);
      
      // Update the product in the local state immediately
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId 
            ? { ...p, status: 'rejected', rejectionReason: rejectionReason, isAvailable: false }
            : p
        )
      );
      
      alert('❌ Product rejected successfully!');
      
      // Also refresh from server
      await fetchProducts();
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.message || 'Failed to reject product');
    } finally {
      setProcessingId(null);
      setRejectingProductId(null);
      setRejectionReason('');
    }
  };

  const handleResetToPending = async (productId) => {
    if (!window.confirm('Reset this product to pending status?')) return;

    try {
      setProcessingId(productId);
      const response = await adminAPI.updateProductStatus(productId, { status: 'pending' });
      console.log('Reset response:', response.data);
      
      // Update the product in the local state immediately
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId 
            ? { ...p, status: 'pending', rejectionReason: null }
            : p
        )
      );
      
      alert('🔄 Product status reset to pending!');
      
      // Also refresh from server
      await fetchProducts();
    } catch (err) {
      console.error('Reset error:', err);
      alert(err.response?.data?.message || 'Failed to reset product status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      setProcessingId(productId);
      await adminAPI.deleteProduct(productId);
      
      // Remove the product from local state immediately
      setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
      
      alert('🗑️ Product deleted successfully!');
      
      // Refresh to get updated counts
      await fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProducts} />;

  return (
    <div className="products-container">
      <div className="products-header">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="page-subtitle">Approve, reject, or manage products on the platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-number">{products.length}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending Approval</h3>
          <p className="stat-number">{products.filter(p => p.status === 'pending' || !p.status).length}</p>
        </div>
        <div className="stat-card approved">
          <h3>Approved</h3>
          <p className="stat-number">{products.filter(p => p.status === 'approved').length}</p>
        </div>
        <div className="stat-card rejected">
          <h3>Rejected</h3>
          <p className="stat-number">{products.filter(p => p.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search products by name or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  {searchTerm ? 'No products match your search' : 'No products found'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const productStatus = product.status || 'pending';
                console.log('Rendering product:', product.name, 'Status:', productStatus);
                
                // Construct proper image URL
                const rawImagePath = product.images?.[0];
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const serverBaseUrl = apiUrl.replace('/api', '');
                const isRelative = rawImagePath && rawImagePath.startsWith('/') && !rawImagePath.startsWith('http');
                const isAbsolute = rawImagePath && rawImagePath.startsWith('http');
                const finalImageSrc = rawImagePath 
                  ? (isAbsolute ? rawImagePath : (isRelative ? `${serverBaseUrl}${rawImagePath}` : `${serverBaseUrl}/uploads/${rawImagePath}`))
                  : '/placeholder.png';
                
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <img
                          src={finalImageSrc}
                          alt={product.name}
                          className="product-image"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                        <div>
                          <span className="product-name">{product.name}</span>
                          {product.rejectionReason && productStatus === 'rejected' && (
                            <p className="rejection-reason">
                              Reason: {product.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{product.seller?.shopName || product.seller?.username || 'N/A'}</td>
                    <td>{product.category?.name || 'Uncategorized'}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.totalStock ?? 0}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(productStatus)}`}>
                        {productStatus}
                      </span>
                    </td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {/* Show approve/reject for pending products */}
                        {productStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(product._id)}
                              disabled={processingId === product._id}
                              className="btn-icon btn-success"
                              title="Approve Product"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectClick(product._id)}
                              disabled={processingId === product._id}
                              className="btn-icon btn-warning"
                              title="Reject Product"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {/* Show reset button for approved/rejected products */}
                        {(productStatus === 'approved' || productStatus === 'rejected') && (
                          <button
                            onClick={() => handleResetToPending(product._id)}
                            disabled={processingId === product._id}
                            className="btn-icon btn-info"
                            title="Reset to Pending"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Show approve button for rejected products */}
                        {productStatus === 'rejected' && (
                          <button
                            onClick={() => handleApprove(product._id)}
                            disabled={processingId === product._id}
                            className="btn-icon btn-success"
                            title="Approve Product"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Delete button always visible */}
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={processingId === product._id}
                          className="btn-icon btn-danger"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => { setShowRejectModal(false); setRejectionReason(''); setRejectingProductId(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Product</h2>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejecting this product..."
                rows="4"
                required
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setRejectingProductId(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleRejectSubmit}
                disabled={!rejectionReason || rejectionReason.trim() === ''}
                style={{ backgroundColor: '#f59e0b' }}
              >
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
