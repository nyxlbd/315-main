import React, { useState, useEffect } from 'react';
import API from '../api';
import './Dashboard.css';

const categories = [
  'delicacies',
  'souvenirs',
  'clothes',
  'art and culture',
  'health',
  'beverages',
];

function Dashboard() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: categories[0],
    sizes: [{ size: '', quantity: '' }],
    variations: '',
    image: null,
    flashSale: false,
    bestSelling: false,
    stock: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Sales insights state
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const res = await API.get('/orders/seller/insights');
        setInsights(res.data);
      } catch {
        setInsights(null);
      }
      setLoadingInsights(false);
    };
    fetchInsights();
  }, []);
  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category', form.category);
      data.append('flashSale', form.flashSale);
      data.append('bestSelling', form.bestSelling);
      if (form.image) data.append('image', form.image);
      if (form.sizes && form.sizes.some(s => s.size && s.quantity)) {
        data.append('sizes', JSON.stringify(form.sizes.filter(s => s.size && s.quantity).map(s => ({ size: s.size, quantity: Number(s.quantity) }))));
      }
      if (form.variations) data.append('variations', form.variations);
      if (form.stock) data.append('stock', form.stock);
      if (editingId) {
        // Parse sizes and variations for PUT
        const putData = {
          name: form.name,
          description: form.description,
          price: form.price,
          category: form.category,
          flashSale: form.flashSale,
          bestSelling: form.bestSelling,
          stock: form.stock,
        };
        if (form.sizes && form.sizes.some(s => s.size && s.quantity)) {
          putData.sizes = form.sizes.filter(s => s.size && s.quantity).map(s => ({ size: s.size, quantity: Number(s.quantity) }));
        } else {
          putData.sizes = [];
        }
        if (form.variations) {
          putData.variations = form.variations.split(',').map(v => ({ name: v.trim(), options: [] }));
        } else {
          putData.variations = [];
        }
        await API.put(`/products/${editingId}`, putData);
        setMessage('Product updated successfully!');
        setEditingId(null);
      } else {
        await API.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage('Product created successfully!');
      }
      setForm({
        name: '', description: '', price: '', category: categories[0], sizes: [{ size: '', quantity: '' }], variations: '', image: null, flashSale: false, bestSelling: false, stock: '',
      });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save product');
    }
    setLoading(false);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes.map(s => ({ size: s.size, quantity: s.quantity })) : [{ size: '', quantity: '' }],
      variations: product.variations?.map(v => v.name).join(',') || '',
      image: null,
      flashSale: product.flashSale,
      bestSelling: product.bestSelling,
      stock: product.stock || '',
    });
  };

  return (
    <div className="container">
      <h2>Seller Dashboard</h2>

      {/* Sales Insights Section */}
      <div className="dashboard-insights">
        <h3>Sales Insights</h3>
        {loadingInsights ? (
          <div>Loading sales insights...</div>
        ) : insights ? (
          <>
            <div className="dashboard-insight-cards">
              <div className="dashboard-insight-card">
                <div className="dashboard-insight-title">Total Sales Today</div>
                <div className="dashboard-insight-value">{insights.totalSalesToday}</div>
              </div>
              <div className="dashboard-insight-card">
                <div className="dashboard-insight-title">Total Orders</div>
                <div className="dashboard-insight-value">{insights.totalOrders}</div>
              </div>
              <div className="dashboard-insight-card">
                <div className="dashboard-insight-title">Total Revenue</div>
                <div className="dashboard-insight-value">${insights.totalRevenue?.toLocaleString()}</div>
              </div>
              <div className="dashboard-insight-card">
                <div className="dashboard-insight-title">Top-Selling Product</div>
                <div className="dashboard-insight-value">
                  {insights.topProduct && insights.productSales && insights.productSales[insights.topProduct]?.name
                    ? `${insights.productSales[insights.topProduct].name} (${insights.topQuantity} sold)`
                    : 'N/A'}
                </div>
              </div>
            </div>
            {/* Monthly Sales Chart */}
            <div className="dashboard-monthly-sales">
              <h4>Monthly Sales Chart</h4>
              <div className="dashboard-sales-chart">
                {insights.monthlySales && Object.keys(insights.monthlySales).length > 0 ? (
                  <table>
                    <thead><tr><th>Day</th><th>Sales</th></tr></thead>
                    <tbody>
                      {Object.entries(insights.monthlySales).map(([day, qty]) => (
                        <tr key={day}><td>{day}</td><td>{qty}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div>No sales this month.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>No insights available.</div>
        )}
      </div>
      <h3>{editingId ? 'Edit Product' : 'Create Product'}</h3>
      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="dashboard-form-group">
          <label>Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="dashboard-form-input" />
        </div>
        <div className="dashboard-form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required className="dashboard-form-input" />
        </div>
        <div className="dashboard-form-group">
          <label>Price</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} required className="dashboard-form-input" />
        </div>
        <div className="dashboard-form-group">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="dashboard-form-select">
            {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
          </select>
        </div>
        <div className="dashboard-form-group">
          <label>Stock (for products without sizes)</label>
          <input type="number" name="stock" value={form.stock} onChange={handleChange} min={0} className="dashboard-form-input" />
        </div>
        <div className="dashboard-form-group">
          <label>Sizes</label>
          {form.sizes.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input type="text" placeholder="Size (e.g. S)" value={s.size} onChange={e => handleSizeChange(idx, 'size', e.target.value)} style={{ width: 60 }} />
              <input type="number" placeholder="Quantity" min={0} value={s.quantity} onChange={e => handleSizeChange(idx, 'quantity', e.target.value)} style={{ width: 80 }} />
              {form.sizes.length > 1 && <button type="button" onClick={() => removeSizeField(idx)}>-</button>}
              {idx === form.sizes.length - 1 && <button type="button" onClick={addSizeField}>+</button>}
            </div>
          ))}
        </div>
        <div className="dashboard-form-group">
          <label>Variations (comma separated, e.g. Red,Blue,Green)</label>
          <input type="text" name="variations" value={form.variations} onChange={handleChange} className="dashboard-form-input" />
        </div>
        <div className="dashboard-form-group">
          <label>Image</label>
          <input type="file" name="image" accept="image/*" onChange={handleChange} />
        </div>
        <div className="dashboard-form-group">
          <label><input type="checkbox" name="flashSale" checked={form.flashSale} onChange={handleChange} /> Flash Sale</label>
          <label style={{ marginLeft: '1rem' }}><input type="checkbox" name="bestSelling" checked={form.bestSelling} onChange={handleChange} /> Best Selling</label>
        </div>
        <button type="submit" className="dashboard-btn" disabled={loading}>{loading ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Create Product')}</button>
        {editingId && <button type="button" className="dashboard-btn cancel" onClick={() => { setEditingId(null); setForm({ name: '', description: '', price: '', category: categories[0], sizes: [{ size: '', quantity: '' }], variations: '', image: null, flashSale: false, bestSelling: false, stock: '' }); }}>Cancel</button>}
      </form>
      {message && <p className="dashboard-message" style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}

      <h3 style={{ marginTop: 40 }}>My Products</h3>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Sizes</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.stock}</td>
              <td>{p.sizes?.map(s => s.size).join(', ')}</td>
              <td>{p.sizes?.reduce((sum, s) => sum + (s.quantity || 0), 0)}</td>
              <td><button className="dashboard-btn" onClick={() => handleEdit(p)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
