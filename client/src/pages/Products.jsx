import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import { categoriesAPI } from '../services/categoriesAPI';
import ProductCard from '../components/ProductCard';
import API from '../services/api';
import './Products.css';

function Products() {
  const [category, setCategory] = useState('');
  const [categoryMap, setCategoryMap] = useState({}); // key/slug -> id
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flashSale, setFlashSale] = useState(false);
  const [bestSelling, setBestSelling] = useState(false);
  const navigate = useNavigate();

  // Fetch categories on mount and build a map of slug/name to _id
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getAll();
        const map = {};
        if (Array.isArray(res.data)) {
          res.data.forEach(cat => {
            map[cat.slug] = cat._id;
            map[cat.name?.toLowerCase()] = cat._id;
          });
        } else if (Array.isArray(res.data.categories)) {
          res.data.categories.forEach(cat => {
            map[cat.slug] = cat._id;
            map[cat.name?.toLowerCase()] = cat._id;
          });
        }
        setCategoryMap(map);
      } catch {
        setCategoryMap({});
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category && categoryMap[category]) params.category = categoryMap[category];
        if (flashSale) params.flashSale = true;
        if (bestSelling) params.bestSelling = true;
        const res = await API.get('/products', { params });
        // Handle both array response and object with products property
        let productsData = [];
        if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (res.data && Array.isArray(res.data.products)) {
          productsData = res.data.products;
        }
        setProducts(productsData);
      } catch (err) {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category, flashSale, bestSelling, categoryMap]);

  return (
    <div className="container">
      <div className="products-filters">
        <button
          onClick={() => { setFlashSale(!flashSale); setBestSelling(false); }}
          className={`products-filter-btn${flashSale ? ' active' : ''}`}
        >
          Flash Sale
        </button>
        <button
          onClick={() => { setBestSelling(!bestSelling); setFlashSale(false); }}
          className={`products-filter-btn${bestSelling ? ' active' : ''}`}
        >
          Best Selling
        </button>
      </div>
      <CategorySelector selected={category} onSelect={cat => { setCategory(cat); setFlashSale(false); setBestSelling(false); }} />
      {loading ? (
        <div>Loading products...</div>
      ) : !Array.isArray(products) || products.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div className="products-list">
          {products.map((product, idx) => (
            <div key={product._id || idx} onClick={() => navigate(`/products/${product._id}`)} className="products-card-link">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
