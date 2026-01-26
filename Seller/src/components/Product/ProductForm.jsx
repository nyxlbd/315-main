import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import './ProductForm.css';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: 0,
    category: '',
    images: [],
    sizeStock: [{ size: '', quantity: '' }],
    isFeatured: false,
    isFlashSale: false,
  });
  const [imageFiles, setImageFiles] = useState([]); // Store File objects for new uploads
  const [existingImages, setExistingImages] = useState([]); // Store existing image paths from server

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      const product = response.data.product;
      // Separate existing images (from server) from blob URLs
      const existing = product.images.filter(img => !img.startsWith('blob:'));
      const blobUrls = product.images.filter(img => img.startsWith('blob:'));
      
      setExistingImages(existing);
      setImageFiles([]); // Clear any file objects
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        category: product.category._id,
        images: [...existing, ...blobUrls], // Show existing + any blob URLs (will be replaced)
        sizeStock: product.sizeStock.length > 0 ? product.sizeStock : [{ size: '', quantity: '' }],
        isFeatured: product.isFeatured,
        isFlashSale: product.isFlashSale,
      });
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'price' || name === 'originalPrice') {
      const price = name === 'price' ? parseFloat(value) : parseFloat(formData.price);
      const originalPrice = name === 'originalPrice' ? parseFloat(value) : parseFloat(formData.originalPrice);
      
      if (price && originalPrice && originalPrice > price) {
        const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
        setFormData(prev => ({ ...prev, discount: discountPercent }));
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    // Store File objects separately for upload
    setImageFiles([...imageFiles, ...files]);
    setFormData({
      ...formData,
      images: [...formData.images, ...imageUrls],
    });
  };

  const removeImage = (index) => {
    const imageToRemove = formData.images[index];
    // If it's a blob URL, revoke it to free memory
    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    
    // Calculate which file to remove (account for existing images)
    const blobUrlCount = formData.images.filter(img => img.startsWith('blob:')).length;
    const blobUrlIndex = formData.images.slice(0, index + 1).filter(img => img.startsWith('blob:')).length - 1;
    
    // Remove from appropriate array
    if (imageToRemove && imageToRemove.startsWith('blob:') && blobUrlIndex >= 0) {
      const newImageFiles = [...imageFiles];
      newImageFiles.splice(blobUrlIndex, 1);
      setImageFiles(newImageFiles);
    } else if (!imageToRemove?.startsWith('blob:')) {
      // Remove from existing images
      const existingIndex = existingImages.indexOf(imageToRemove);
      if (existingIndex >= 0) {
        setExistingImages(existingImages.filter((_, i) => i !== existingIndex));
      }
    }
    
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSizeStockChange = (index, field, value) => {
    const newSizeStock = [...formData.sizeStock];
    newSizeStock[index][field] = value;
    setFormData({ ...formData, sizeStock: newSizeStock });
  };

  const addSizeStock = () => {
    setFormData({
      ...formData,
      sizeStock: [...formData.sizeStock, { size: '', quantity: '' }],
    });
  };

  const removeSizeStock = (index) => {
    setFormData({
      ...formData,
      sizeStock: formData.sizeStock.filter((_, i) => i !== index),
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const totalStock = formData.sizeStock.reduce(
        (sum, item) => sum + parseInt(item.quantity || 0),
        0
      );

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('originalPrice', parseFloat(formData.originalPrice || formData.price));
      formDataToSend.append('discount', formData.discount);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('totalStock', totalStock);
      formDataToSend.append('isFeatured', formData.isFeatured);
      formDataToSend.append('isFlashSale', formData.isFlashSale);
      
      // Add existing images (file paths from server)
      existingImages.forEach((imgPath, index) => {
        formDataToSend.append(`existingImages[${index}]`, imgPath);
      });
      
      // Add new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      // Add sizeStock as JSON string
      formDataToSend.append('sizeStock', JSON.stringify(formData.sizeStock));
      


      if (isEditMode) {
        await productsAPI.update(id, formDataToSend);
      } else {
        await productsAPI.create(formDataToSend);
      }

      // Clean up blob URLs
      formData.images.forEach(img => {
        if (img.startsWith('blob:')) {
          URL.revokeObjectURL(img);
        }
      });

      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <LoadingSpinner size="large" />;

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button onClick={() => navigate('/products')} className="form-back-button">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="form-title">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="product-form-card">
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            <div className="form-row">
              <div className="form-group form-row-full">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group form-row-full">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="form-textarea"
                  placeholder="Describe your product..."
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="filter-select"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Pricing</h2>
            <div className="form-row">
              <div className="form-group">
                <p className= "input-label">Price *</p>
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Price *"
                />
              </div>

              <div className="form-group">
                <p className= "input-label">Original Price</p>
                <label className="form-label">Original Price (Optional)</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Original price (Optional)"
                />
              </div>

              <div className="form-group">
                <p className= "input-label">Discount %</p>
                <label className="form-label">Discount %</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  readOnly
                  className="form-input"
                  placeholder="Discount %"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Product Images</h2>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload className="upload-icon w-12 h-12" />
                <p className="upload-text">Click to upload images</p>
                <p className="upload-hint">PNG, JPG up to 5MB (Max 5 images)</p>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="image-preview-grid">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={image} alt={`Preview ${index + 1}`} className="preview-image" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h2 className="section-title">Size & Stock</h2>
            <div className="size-stock-list">
              {formData.sizeStock.map((item, index) => (
                <div key={index} className="size-stock-item">
                  <div className="form-group">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      value={item.size}
                      onChange={(e) => handleSizeStockChange(index, 'size', e.target.value)}
                      className="form-input"
                      placeholder="e.g., S, M, L, One Size"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleSizeStockChange(index, 'quantity', e.target.value)}
                      className="form-input"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  {formData.sizeStock.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSizeStock(index)}
                      className="btn-remove-size"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addSizeStock} className="btn-add-size">
              <Plus className="w-4 h-4" />
              Add Size
            </button>
          </div>



          <div className="form-section">
            <h2 className="section-title">Additional Settings</h2>
            <div className="form-row">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="form-checkbox"
                  id="isFeatured"
                />
                <label htmlFor="isFeatured" className="checkbox-label">
                  Featured Product
                </label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="isFlashSale"
                  checked={formData.isFlashSale}
                  onChange={handleChange}
                  className="form-checkbox"
                  id="isFlashSale"
                />
                <label htmlFor="isFlashSale" className="checkbox-label">
                  Flash Sale
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;