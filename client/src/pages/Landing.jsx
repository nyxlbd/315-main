
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext';
// import { isAuthenticated } from '../auth';
import { isAuthenticated } from '../auth';
import API from '../services/api';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';

function Landing() {
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [bestSelling, setBestSelling] = useState([]);
  const [flashSale, setFlashSale] = useState([]);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingFlash, setLoadingFlash] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  // Sync search state with URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search') || '';
    setSearch(searchQuery);
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category) params.category = category;
        if (search) params.search = search;
        const res = await API.get('/products', { params });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category, search]);

  // Fetch best selling and flash sale products
  useEffect(() => {
    const fetchBestSelling = async () => {
      setLoadingBest(true);
      try {
        const res = await API.get('/products', { params: { bestSelling: true } });
        // Handle both array response and object with products property
        let productsData = [];
        if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (res.data && Array.isArray(res.data.products)) {
          productsData = res.data.products;
        }
        setBestSelling(productsData);
      } catch {
        setBestSelling([]);
      }
      setLoadingBest(false);
    };
    const fetchFlashSale = async () => {
      setLoadingFlash(true);
      try {
        const res = await API.get('/products', { params: { flashSale: true } });
        // Handle both array response and object with products property
        let productsData = [];
        if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (res.data && Array.isArray(res.data.products)) {
          productsData = res.data.products;
        }
        setFlashSale(productsData);
      } catch {
        setFlashSale([]);
      }
      setLoadingFlash(false);
    };
    fetchBestSelling();
    fetchFlashSale();
  }, []);

  const handleAddToCart = (e, product) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:87',message:'handleAddToCart entry',data:{hasProduct:!!product,hasEvent:!!e,productType:typeof product,productKeys:product?Object.keys(product):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('handleAddToCart called', { product, event: e, productKeys: product ? Object.keys(product) : 'no product' });
    
    // Prevent event propagation if event is provided
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate product - check for both _id (MongoDB) and id (some APIs)
    if (!product) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:97',message:'Product validation failed - null/undefined',data:{product},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Cannot add to cart: product is null/undefined', product);
      alert('Cannot add product to cart. Product information is missing.');
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:104',message:'Before productId extraction',data:{has_id:!!product._id,_id:product._id,_idType:typeof product._id,hasId:!!product.id,id:product.id,productKeys:Object.keys(product)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Get the product ID (support both _id and id, handle ObjectId objects)
    let productId = product._id || product.id;
    
    // Handle MongoDB ObjectId objects - convert to string if needed
    if (productId && typeof productId === 'object' && productId.toString) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:107',message:'Converting ObjectId to string',data:{productIdBefore:productId,productIdType:typeof productId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      productId = productId.toString();
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:112',message:'After productId extraction',data:{productId,productIdType:typeof productId,isFalsy:!productId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Also check if _id exists but is falsy (empty string, null, etc.)
    if (!productId) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:113',message:'ProductId validation failed',data:{product,productId,_id:product._id,id:product.id,productKeys:Object.keys(product),stringified:JSON.stringify(product)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Cannot add to cart: product missing _id or id', {
        product,
        _id: product._id,
        _id_type: typeof product._id,
        _id_value: product._id,
        has_id: !!product._id,
        hasId: !!product.id,
        id_value: product.id,
        keys: product ? Object.keys(product) : 'no product',
        stringified: JSON.stringify(product)
      });
      alert('Cannot add product to cart. Product ID is missing.');
      return;
    }
    
    // If product has variations or sizes, redirect to detail page
    if ((product.variations && product.variations.length > 0) || (product.sizes && product.sizes.length > 0)) {
      console.log('Product has variations/sizes, redirecting to detail page');
      navigate(`/products/${productId}`);
      return;
    }
    
    // Add to cart (works for both authenticated and non-authenticated users)
    console.log('Adding product to cart:', product.name, productId);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:155',message:'Before calling addToCart',data:{product,productKeys:Object.keys(product),product_id:product._id,productId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      addToCart(product, 1, null, null);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:157',message:'addToCart called successfully',data:{productName:product.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.log('Product added to cart successfully:', product.name);
      // Show success feedback
      alert(`${product.name} added to cart!`);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:161',message:'Error in addToCart call',data:{error:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  return (
    <div className="container" style={isAuthenticated() ? { marginLeft: 220 } : {}}>
      <h1>Pine City Made</h1>
      <div className="products-filters">
        {/* <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="products-search-bar"
        /> */}
        <CategorySelector selected={category} onSelect={setCategory} />
      </div>

      {/* Best Selling Section */}
      <div className="products-section">
        <h2>Best Selling</h2>
        {loadingBest ? (
          <div>Loading best selling products...</div>
        ) : !Array.isArray(bestSelling) || bestSelling.length === 0 ? (
          <div>No best selling products found.</div>
        ) : (
          <div className="products-list">
            {bestSelling.map((product, idx) => {
              const handleClick = (e) => {
                handleAddToCart(e, product);
              };
              return (
                <div key={product._id || idx} className="products-card-link">
                  <ProductCard product={product} onAddToCart={handleClick} showAddToCart />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Flash Sale Section */}
      <div className="products-section">
        <h2>Flash Sale</h2>
        {loadingFlash ? (
          <div>Loading flash sale products...</div>
        ) : !Array.isArray(flashSale) || flashSale.length === 0 ? (
          <div>No flash sale products found.</div>
        ) : (
          <div className="products-list">
            {flashSale.map((product, idx) => {
              const handleClick = (e) => {
                handleAddToCart(e, product);
              };
              return (
                <div key={product._id || idx} className="products-card-link">
                  <ProductCard product={product} onAddToCart={handleClick} showAddToCart />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Products Section */}
      <div className="products-section">
        <h2>All Products</h2>
        {loading ? (
          <div>Loading products...</div>
        ) : !Array.isArray(products) || products.length === 0 ? (
          <div>No products found.</div>
        ) : (
          <div className="products-list">
            {products.map((product, idx) => {
              // Create a stable handler that captures the product
              const handleClick = (e) => {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/a4b118a0-b7d4-495b-8fd5-a719d2a4aeeb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Landing.jsx:160',message:'handleClick called - product from closure',data:{hasProduct:!!product,product_id:product?._id,productName:product?.name,productKeys:product?Object.keys(product):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                handleAddToCart(e, product);
              };
              return (
                <div key={product._id || idx} className="products-card-link">
                  <ProductCard product={product} onAddToCart={handleClick} showAddToCart />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Landing;
