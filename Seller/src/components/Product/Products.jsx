import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerAPI, categoriesAPI, productsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Plus, Edit2, Trash2, Package, Eye, Star } from 'lucide-react';
import './Products.css';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    availability: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        sellerAPI.getProducts(filters),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsAPI.delete(productId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading && products.length === 0) return <LoadingSpinner size="large" />;

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title">My Products</h1>
        <button
          onClick={() => navigate('/products/new')}
          className="btn-add-product"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="products-filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search products..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Availability</label>
            <select
              name="availability"
              value={filters.availability}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Products</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {products.length === 0 ? (
        <div className="products-empty">
          <Package className="empty-icon" />
          <h3 className="empty-title">No Products Found</h3>
          <p className="empty-description">
            Start adding products to your shop
          </p>
          <button
            onClick={() => navigate('/products/new')}
            className="btn-add-product"
          >
            <Plus className="w-5 h-5" />
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => {
            const imageUrl = product.images[0] || '/placeholder.png';
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const serverBaseUrl = apiUrl.replace('/api', '');
            const isBlobUrl = imageUrl.startsWith('blob:');
            const isRelative = imageUrl.startsWith('/') && !imageUrl.startsWith('http');
            // Blob URLs are invalid after navigation, show placeholder instead
            const finalImageUrl = isBlobUrl 
              ? '/placeholder.png' 
              : (isRelative ? `${serverBaseUrl}${imageUrl}` : imageUrl);
            
            return (
            <div key={product._id} className="product-card">
              <div className="product-image-wrapper">
                <img
                  src={finalImageUrl}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-badges">
                  {product.isFeatured && (
                    <span className="badge badge-featured">Featured</span>
                  )}
                  {product.isFlashSale && (
                    <span className="badge badge-flash-sale">Flash Sale</span>
                  )}
                  {!product.isAvailable && (
                    <span className="badge badge-unavailable">Unavailable</span>
                  )}
                </div>
              </div>

              <div className="product-content">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>

                <div className="product-info">
                  <div className="product-price">
                    <span className="price-current">
                      {formatCurrency(product.price)}
                    </span>
                    {product.discount > 0 && (
                      <span className="price-original">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="product-meta">
                    <span className="product-meta-item">
                      <Package className="w-4 h-4" />
                      Stock: {product.totalStock}
                    </span>
                    <span className="product-meta-item">
                      <Eye className="w-4 h-4" />
                      Sold: {product.soldCount || 0}
                    </span>
                    <span className="product-meta-item">
                      <Star className="w-4 h-4" />
                      {product.rating?.average || 0} ({product.rating?.count || 0})
                    </span>
                  </div>
                </div>

                <div className="product-actions">
                  <button
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                    className="btn-icon btn-icon-edit"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn-icon btn-icon-delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;