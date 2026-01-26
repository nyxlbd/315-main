import React, { useState } from 'react';
import { useCart } from '../CartContext';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Cart.css';


function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [delivery, setDelivery] = useState({ name: '', address: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setError('');
    if (!delivery.name || !delivery.address || !delivery.phone) {
      setError('Please fill in all delivery details.');
      return;
    }
    try {
      const items = (Array.isArray(cart) ? cart : []).map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        size: item.size || '',
        variationName: item.variationName || '',
        price: item.product.price,
        seller: item.product.seller?._id || item.product.seller
      }));
      await API.post('/orders', {
        items,
        shippingAddress: {
          name: delivery.name,
          street: delivery.address,
          phone: delivery.phone
        },
        paymentMethod: 'cod'
      });
      clearCart();
      setCheckingOut(false);
      navigate('/orders');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Checkout failed. Please try again.';
      setError(errorMessage);
    }
  };

  const total = Array.isArray(cart) ? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) : 0;

  return (
    <div className="container">
      <h2>Cart</h2>
      <table style={{ width: '100%', marginBottom: 20 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(cart) ? cart : []).map(item => {
            let maxQty = undefined;
            let sizesArr = [];
            if (Array.isArray(item.product.variations) && item.product.variations.length > 0 && item.size) {
              let variationIdx = 0;
              if (item.variationName) {
                variationIdx = item.product.variations.findIndex(v => v.name === item.variationName || v.variationName === item.variationName);
                if (variationIdx === -1) variationIdx = 0;
              }
              sizesArr = item.product.variations[variationIdx]?.options?.[0]?.sizes || [];
            } else if (Array.isArray(item.product.sizes)) {
              sizesArr = item.product.sizes;
            }
            if (sizesArr && sizesArr.length > 0 && item.size) {
              const sizeObj = sizesArr.find(s => s.size === item.size);
              if (sizeObj) maxQty = sizeObj.quantity;
            } else if (item.product.stock !== undefined) {
              maxQty = item.product.stock;
            }
            return (
              <tr key={item.product._id + (item.variationName || '') + (item.size || '')}>
                <td>{item.product.name}{item.size ? ` (${item.size})` : ''}</td>
                <td>${item.product.price}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={item.quantity}
                    onChange={e => {
                      let val = Math.max(1, Number(e.target.value));
                      if (maxQty !== undefined) val = Math.min(val, maxQty);
                      updateQuantity(item.product._id, val, item.size, item.variationName);
                    }}
                    className="cart-qty-input"
                    style={{ width: 50 }}
                  />
                </td>
                <td>${item.product.price * item.quantity}</td>
                <td>
                  <button onClick={() => removeFromCart(item.product._id, item.size, item.variationName)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontWeight: 'bold', marginBottom: 20 }}>Total: ${total}</div>
      {checkingOut ? (
        <div style={{ marginBottom: 20 }}>
          <h3>Delivery Details</h3>
          <input
            type="text"
            placeholder="Name"
            value={delivery.name}
            onChange={e => setDelivery({ ...delivery, name: e.target.value })}
            style={{ display: 'block', marginBottom: 8, width: 300 }}
          />
          <input
            type="text"
            placeholder="Address"
            value={delivery.address}
            onChange={e => setDelivery({ ...delivery, address: e.target.value })}
            style={{ display: 'block', marginBottom: 8, width: 300 }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={delivery.phone}
            onChange={e => setDelivery({ ...delivery, phone: e.target.value })}
            style={{ display: 'block', marginBottom: 8, width: 300 }}
          />
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <button onClick={handleCheckout} style={{ background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontSize: '1rem', cursor: 'pointer', marginRight: 10 }}>Checkout</button>
          <button onClick={() => setCheckingOut(false)} style={{ border: 'none', background: 'none', color: '#4b7c54', cursor: 'pointer' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setCheckingOut(true)} style={{ background: '#4b7c54', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>Proceed to Checkout</button>
      )}
    </div>
  );
}

export default Cart;
