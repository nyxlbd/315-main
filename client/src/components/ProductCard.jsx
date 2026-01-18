import React from 'react';
import './ProductCard.css';

function ProductCard({ product, onAddToCart, showAddToCart, sellerName, onDelete }) {
  const rawImageUrl = product.images?.[0];
  const apiUrl = 'http://localhost:5000';
  let finalImageUrl = 'https://via.placeholder.com/120';
  if (rawImageUrl) {
    const isBlobUrl = rawImageUrl.startsWith('blob:');
    const isFullPath = rawImageUrl.startsWith('/uploads/');
    const isAbsolute = rawImageUrl.startsWith('http');
    const isJustFilename = !rawImageUrl.includes('/') && !rawImageUrl.startsWith('http') && !rawImageUrl.startsWith('blob:');
    if (isBlobUrl) {
      finalImageUrl = 'https://via.placeholder.com/120';
    } else if (isAbsolute) {
      finalImageUrl = rawImageUrl;
    } else if (isFullPath) {
      finalImageUrl = `${apiUrl}${rawImageUrl}`;
    } else if (isJustFilename) {
      finalImageUrl = `${apiUrl}/uploads/${rawImageUrl}`;
    } else {
      finalImageUrl = `${apiUrl}/uploads/${rawImageUrl}`;
    }
  }
  return (
    <div className="product-card">
      {product.flashSale && <div className="product-badge">-25%</div>}
      <div className="product-image">
        <img 
          src={finalImageUrl} 
          alt={product.name}
        />
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          <span className="current">${product.price}</span>
          {product.flashSale && <span className="old">${(product.price * 1.25).toFixed(2)}</span>}
        </div>
        <div className="product-rating">
          <span>★</span> 4.9 <span className="product-reviews">(75)</span>
        </div>
        {sellerName && (
          <div className="admin-panel-product-seller" style={{ marginTop: '0.5rem', color: '#357a38', fontWeight: 500 }}>
            Seller: {sellerName}
          </div>
        )}
        {onDelete && (
          <button className="admin-panel-delete-btn" style={{ marginTop: '0.7rem', width: '90%' }} onClick={onDelete}>Delete</button>
        )}
      </div>
      {showAddToCart && (
        <button 
          className="add-to-cart" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onAddToCart) {
              onAddToCart(e);
            } else {
              console.error('onAddToCart handler is not provided');
            }
          }}
        >
          Add To Cart
        </button>
      )}
    </div>
  );
}

export default ProductCard;
