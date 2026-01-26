import React, { useEffect, useState } from 'react';
import { useCart } from '../CartContext';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getCurrentUser, getUserRole } from '../auth';
import ReviewReplyForm from '../components/ReviewReplyForm';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState([]); // {variationIdx, optionIdx, size, quantity}
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const user = getCurrentUser();
  const userRole = getUserRole();
  const isSeller = userRole === 'seller' && user && product && user._id === (product.seller?._id || product.seller);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/products/${id}`);
        setProduct(res.data.product || res.data);
      } catch (err) {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  // Always fetch reviews after a seller reply
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await API.get(`/reviews/product/${id}`);
        setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : []);
      } catch {
        setReviews([]);
      }
      setReviewsLoading(false);
    };
    fetchReviews();
  }, [id, replyingReviewId]);

  // For products with variations, default to first option/size
  useEffect(() => {
    if (product && product.variations && product.variations.length > 0) {
      setSelectedVariation(0);
      setSelectedOption(0);
      const firstSizes = product.variations[0]?.options?.[0]?.sizes;
      if (firstSizes && firstSizes.length > 0) {
        setSelectedSize(firstSizes[0].size);
      } else {
        setSelectedSize('');
      }
      setQuantity(1);
    } else {
      setSelectedVariation(0);
      setSelectedOption(0);
      setSelectedSize('');
      setQuantity(1);
    }
  }, [product]);

  if (loading) return <div className="container">Loading...</div>;
  if (!product) return <div className="container">Product not found.</div>;

  const rawImageUrl = product.images?.[0];
  const apiUrl = 'http://localhost:5000';
  let finalImageUrl = 'https://via.placeholder.com/200';
  if (rawImageUrl) {
    const isBlobUrl = rawImageUrl.startsWith('blob:');
    const isFullPath = rawImageUrl.startsWith('/uploads/');
    const isAbsolute = rawImageUrl.startsWith('http');
    const isJustFilename = !rawImageUrl.includes('/') && !rawImageUrl.startsWith('http') && !rawImageUrl.startsWith('blob:');
    if (isBlobUrl) {
      finalImageUrl = 'https://via.placeholder.com/200';
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
    <div className="container">
      <div className="product-detail-flex">
        <img
          src={finalImageUrl}
          alt={product.name}
          className="product-detail-image"
        />
        <div className="product-detail-main">
          <h2>{product.name}</h2>
          <div className="product-detail-price">
            ${product.price}
          </div>
          <div className="product-detail-description">{product.description}</div>
          {/* Product options/variations/quantity/add to cart code START */}
          {product.sizeStock && product.sizeStock.length > 0 ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Size:</strong>
                <select
                  value={selectedSize}
                  onChange={e => {
                    setSelectedSize(e.target.value);
                    setQuantity(1);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  {product.sizeStock.map((s, idx) => (
                    <option key={`${s.size}-${idx}`} value={s.size} disabled={s.quantity === 0}>
                      {s.size} ({s.quantity} available)
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Quantity:</strong>
                <input
                  type="number"
                  min={1}
                  max={
                    product.sizeStock.find(s => s.size === selectedSize)?.quantity || 1
                  }
                  value={quantity}
                  onChange={e => {
                    const maxQty =
                      product.sizeStock.find(s => s.size === selectedSize)?.quantity || 1;
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > maxQty) val = maxQty;
                    setQuantity(val);
                  }}
                  style={{ marginLeft: 8, width: 60 }}
                />
              </div>
              <button
                style={{
                  background: '#4b7c54',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.2rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginBottom: 12,
                }}
                onClick={() => {
                  if (
                    selections.some(
                      sel => sel.size === selectedSize
                    )
                  )
                    return;
                  const cartItem = cart.find(
                    item =>
                      item.product._id === product._id &&
                      item.size === selectedSize
                  );
                  const alreadyInCart = cartItem ? cartItem.quantity : 0;
                  const maxQty =
                    product.sizeStock.find(s => s.size === selectedSize)?.quantity || 1;
                  if (alreadyInCart + quantity > maxQty) {
                    alert('You cannot add more than the available stock for this size.');
                    return;
                  }
                  setSelections([
                    ...selections,
                    {
                      size: selectedSize,
                      quantity,
                    },
                  ]);
                }}
                disabled={
                  !selectedSize ||
                  quantity < 1 ||
                  quantity > (product.sizeStock.find(s => s.size === selectedSize)?.quantity || 1) ||
                  selections.some(sel => sel.size === selectedSize)
                }
              >
                Add Selection
              </button>
            </>
          ) : null}
          {/* For products without variations: show quantity input and add to cart */}
          {(!product.variations || product.variations.length === 0) && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Quantity:</strong>
                <input
                  type="number"
                  min={1}
                  max={product.stock || 1}
                  value={quantity}
                  onChange={e => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (product.stock && val > product.stock) val = product.stock;
                    setQuantity(val);
                  }}
                  style={{ marginLeft: 8, width: 60 }}
                />
              </div>
              <button
                style={{
                  background: '#4b7c54',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.2rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const cartItem = cart.find(item => item.product._id === product._id);
                  const alreadyInCart = cartItem ? cartItem.quantity : 0;
                  if (alreadyInCart + quantity > (product.stock || 1)) {
                    alert('You cannot add more than the available stock.');
                    return;
                  }
                  addToCart(product, quantity);
                  setAdded(true);
                  setTimeout(() => {
                    setAdded(false);
                    navigate('/products');
                  }, 800);
                }}
                disabled={product.stock !== undefined && quantity > product.stock}
              >
                {added ? 'Added!' : 'Add to Cart'}
              </button>
            </>
          )}
          {selections.length > 0 && (
            <div style={{ margin: '1.5rem 0' }}>
              <h4>Selected Sizes</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Size</th>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Quantity</th>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.map((sel, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 6, border: '1px solid #ccc' }}>{sel.size}</td>
                      <td style={{ padding: 6, border: '1px solid #ccc' }}>{sel.quantity}</td>
                      <td style={{ padding: 6, border: '1px solid #ccc' }}>
                        <button
                          onClick={() =>
                            setSelections(selections.filter((_, i) => i !== idx))
                          }
                          style={{
                            color: '#b00',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                style={{
                  background: '#4b7c54',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.2rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  for (const sel of selections) {
                    const cartItem = cart.find(
                      item =>
                        item.product._id === product._id &&
                        item.size === sel.size
                    );
                    const alreadyInCart = cartItem ? cartItem.quantity : 0;
                    const maxQty = product.sizeStock.find(s => s.size === sel.size)?.quantity || 1;
                    if (alreadyInCart + sel.quantity > maxQty) {
                      alert(
                        `You cannot add more than the available stock for size: ${sel.size}.`
                      );
                      return;
                    }
                  }
                  selections.forEach(sel => {
                    addToCart(
                      product,
                      sel.quantity,
                      sel.size
                    );
                  });
                  setSelections([]);
                  setAdded(true);
                  setTimeout(() => {
                    setAdded(false);
                    navigate('/products');
                  }, 800);
                }}
              >
                {added ? 'Added!' : 'Add All to Cart'}
              </button>
            </div>
          )}
          {/* Product options/variations/quantity/add to cart code END */}
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Product Reviews</h3>
          <button
            onClick={() => {
              setReviewsLoading(true);
              API.get(`/reviews/product/${id}`).then(res => setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : [])).finally(() => setReviewsLoading(false));
            }}
            style={{ background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 1rem', cursor: 'pointer', fontSize: '1rem' }}
            disabled={reviewsLoading}
          >
            Refresh
          </button>
        </div>
        {reviewsLoading ? (
          <div>Loading reviews...</div>
        ) : !Array.isArray(reviews) || reviews.length === 0 ? (
          <div>No reviews yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map(review => (
              <div
                key={review._id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#4b7c54' }}>
                  Rating: {review.rating} / 5
                </div>
                <div style={{ margin: '4px 0' }}>{review.comment}</div>
                <div style={{ fontSize: '0.95em', color: '#666' }}>
                  By: {review.client?.name || 'Client'} on{' '}
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
                {review.reply && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: 8,
                      background: '#f6fff6',
                      border: '1px solid #b6e2b6',
                      borderRadius: 6,
                    }}
                  >
                    <strong>Seller Reply:</strong> {review.reply}
                  </div>
                )}
                {/* Seller reply form */}
                {isSeller && !review.reply && (
                  replyingReviewId === review._id ? (
                    <ReviewReplyForm
                      reviewId={review._id}
                      loading={replyLoading}
                      onSubmit={async (replyText) => {
                        setReplyLoading(true);
                        try {
                          await API.patch(`/reviews/${review._id}/reply`, { reply: replyText });
                          setReplyingReviewId(null);
                          setReviewsLoading(true);
                          const res = await API.get(`/reviews/product/${id}`);
                          setReviews(Array.isArray(res.data) ? res.data : []);
                        } catch {
                          alert('Failed to submit reply.');
                        }
                        setReplyLoading(false);
                      }}
                      onCancel={() => setReplyingReviewId(null)}
                    />
                  ) : (
                    <button
                      style={{ marginTop: 8, background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 1rem', cursor: 'pointer' }}
                      onClick={() => setReplyingReviewId(review._id)}
                    >
                      Reply
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;

