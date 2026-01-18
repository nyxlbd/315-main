import React, { useEffect, useState } from 'react';
import API from '../api';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import SellerOrders from './SellerOrders';
import SellerReviews from './SellerReviews';
import SellerMessages from './SellerMessages';
import Sidebar from '../components/Sidebar';
import './SellerProducts.css';


function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    const res = await API.get('/products?mine=1');
    setProducts(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setModalOpen(true);
  };


  const handleSaved = () => {
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await API.delete(`/products/${productId}`);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const filtered = Array.isArray(products) ? products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!category || p.category === category) &&
    (!availability || (availability === 'available' ? p.isAvailable : !p.isAvailable))
  ) : [];

  return (
    <div className="seller-dashboard-wrapper" style={{ display: 'flex', minHeight: '80vh' }}>
      <Sidebar activeTab={tab} setTab={setTab} role="seller" />
      <div style={{ flex: 1, padding: '2rem 2rem', marginLeft: 0 }}>
        {tab === 'products' && (
          <>
            <div className="seller-products-page">
              <div className="seller-products-header">
                <h1>My Products</h1>
                <button className="add-product-btn" onClick={handleAdd}>+ Add Product</button>
              </div>
              <div className="seller-products-filters">
                <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="delicacies">Delicacies</option>
                  <option value="souvenirs">Souvenirs</option>
                  <option value="clothes">Clothes</option>
                  <option value="art and culture">Art and Culture</option>
                  <option value="health">Health</option>
                  <option value="beverages">Beverages</option>
                </select>
                <select value={availability} onChange={e => setAvailability(e.target.value)}>
                  <option value="">All Products</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="seller-products-grid">
                {filtered.map(product => (
                  <div className="seller-product-card" key={product._id}>
                    <img src={product.images?.[0] ? `http://localhost:5000/uploads/${product.images[0]}` : 'https://via.placeholder.com/120'} alt={product.name} />
                    <div className="seller-product-info">
                      <div className="seller-product-title">{product.name}</div>
                      <div className="seller-product-desc">{product.description}</div>
                      <div className="seller-product-price">₱{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="seller-product-meta">
                        <span>Stock: {
                          Array.isArray(product.variations) && product.variations.length > 0
                            ? product.variations.reduce((total, v) =>
                                total + (Array.isArray(v.options)
                                  ? v.options.reduce((optSum, opt) =>
                                      optSum + (Array.isArray(opt.sizes)
                                        ? opt.sizes.reduce((szSum, sz) => szSum + (Number(sz.quantity) || 0), 0)
                                        : 0)
                                    , 0)
                                  : 0)
                              , 0)
                            : (Number(product.stock) || 0)
                        }</span>
                        <span>Sold: {product.sold || 0}</span>
                        <span>★ {product.rating || 0} ({product.reviews?.length || 0})</span>
                      </div>
                    </div>
                    <div className="seller-product-actions">
                      <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(product._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
              <ProductForm open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} product={editProduct} />
            </Modal>
          </>
        )}
        {tab === 'orders' && (
          <SellerOrders />
        )}
        {tab === 'reviews' && (
          <SellerReviews />
        )}
        {tab === 'messages' && (
          <SellerMessages />
        )}
      </div>
    </div>
  );
}

export default SellerProducts;
