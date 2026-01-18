import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCategories();
      console.log('Categories response:', response.data);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory._id, formData);
        alert('✅ Category updated successfully!');
      } else {
        await adminAPI.createCategory(formData);
        alert('✅ Category created successfully!');
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', icon: '' });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this category?')) return;

    try {
      await adminAPI.deleteCategory(categoryId);
      alert('🗑️ Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', icon: '' });
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCategories} />;

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div>
          <h1 className="page-title">Categories Management</h1>
          <p className="page-subtitle">Manage product categories on the platform</p>
        </div>
        <button className="btn-primary" onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <h3>Total Categories</h3>
          <p className="stat-number">{categories.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-number">
            {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-grid">
        {categories.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" />
            <p>No categories found</p>
            <button className="btn-primary" onClick={handleAddNew}>
              Create First Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category._id} className="category-card">
              <div className="category-icon">
                {category.icon || '📦'}
              </div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">
                {category.description || 'No description'}
              </p>
              <div className="category-meta">
                <span className="product-count">
                  {category.productCount || 0} products
                </span>
              </div>
              <div className="category-actions">
                <button
                  className="btn-icon-small btn-edit"
                  onClick={() => handleEdit(category)}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="btn-icon-small btn-delete"
                  onClick={() => handleDelete(category._id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Handicrafts"
                />
              </div>
              
              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="e.g., handicrafts"
                />
              </div>
              
              <div className="form-group">
                <label>Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., 🎨"
                  maxLength="2"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
