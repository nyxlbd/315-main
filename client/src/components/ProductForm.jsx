import React, { useState, useEffect } from 'react';
import API from '../api';

const categories = [
  'delicacies',
  'souvenirs',
  'clothes',
  'art and culture',
  'health',
  'beverages',
];

function ProductForm({ open, onClose, onSaved, product }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: categories[0],
    variations: [{ name: '', options: [{ value: '', sizes: [{ size: '', quantity: '' }] }] }],
    images: [], // new local files
    existingImages: [], // server images (filenames)
    flashSale: false,
    bestSelling: false,
    stock: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        variations: product.variations && product.variations.length > 0
          ? product.variations.map(v => ({
              name: v.name,
              options: v.options && v.options.length > 0
                ? v.options.map(opt => ({
                    value: typeof opt === 'object' ? opt.value : opt,
                    sizes: (opt.sizes && opt.sizes.length > 0) ? opt.sizes : [{ size: '', quantity: '' }],
                  }))
                : [{ value: '', sizes: [{ size: '', quantity: '' }] }],
            }))
          : [{ name: '', options: [{ value: '', sizes: [{ size: '', quantity: '' }] }] }],
        images: [], // new local files
        existingImages: Array.isArray(product.images) ? product.images : [],
        flashSale: product.flashSale,
        bestSelling: product.bestSelling,
        stock: product.stock || '',
      });
    } else {
      setForm({
        name: '', description: '', price: '', category: categories[0], variations: [{ name: '', options: [{ value: '', sizes: [{ size: '', quantity: '' }] }] }], images: [], existingImages: [], flashSale: false, bestSelling: false, stock: '',
      });
    }
  }, [product, open]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (type === 'file') {
      // Add new files to current images, up to 5, prevent duplicates
      let newFiles = Array.from(files);
      let current = Array.isArray(form.images) ? form.images : Array.from(form.images || []);
      // Filter out duplicates by name and size
      newFiles = newFiles.filter(f => !current.some(c => c.name === f.name && c.size === f.size));
      // Only allow up to 5 total (existing + new)
      const totalAllowed = 5 - (form.existingImages?.length || 0);
      const combined = [...current, ...newFiles].slice(0, totalAllowed);
      setForm({ ...form, images: combined });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Variation handlers
  const handleVariationNameChange = (idx, value) => {
    const newVars = form.variations.map((v, i) => i === idx ? { ...v, name: value } : v);
    setForm({ ...form, variations: newVars });
  };
  const handleVariationOptionChange = (varIdx, optIdx, value) => {
    const newVars = form.variations.map((v, i) => {
      if (i !== varIdx) return v;
      const newOpts = v.options.map((o, j) => j === optIdx ? { ...o, value } : o);
      return { ...v, options: newOpts };
    });
    setForm({ ...form, variations: newVars });
  };

  const handleVariationOptionSizeChange = (varIdx, optIdx, sizeIdx, field, value) => {
    const newVars = form.variations.map((v, i) => {
      if (i !== varIdx) return v;
      const newOpts = v.options.map((o, j) => {
        if (j !== optIdx) return o;
        const newSizes = o.sizes.map((s, k) => k === sizeIdx ? { ...s, [field]: value } : s);
        return { ...o, sizes: newSizes };
      });
      return { ...v, options: newOpts };
    });
    setForm({ ...form, variations: newVars });
  };
  const addVariationOptionSize = (varIdx, optIdx) => {
    const newVars = form.variations.map((v, i) => {
      if (i !== varIdx) return v;
      const newOpts = v.options.map((o, j) => j === optIdx ? { ...o, sizes: [...o.sizes, { size: '', quantity: '' }] } : o);
      return { ...v, options: newOpts };
    });
    setForm({ ...form, variations: newVars });
  };
  const removeVariationOptionSize = (varIdx, optIdx, sizeIdx) => {
    const newVars = form.variations.map((v, i) => {
      if (i !== varIdx) return v;
      const newOpts = v.options.map((o, j) => {
        if (j !== optIdx) return o;
        return { ...o, sizes: o.sizes.filter((_, k) => k !== sizeIdx) };
      });
      return { ...v, options: newOpts };
    });
    setForm({ ...form, variations: newVars });
  };
  const addVariation = () => {
    setForm({ ...form, variations: [...form.variations, { name: '', options: [{ value: '', sizes: [{ size: '', quantity: '' }] }] }] });
  };
  const removeVariation = (idx) => {
    setForm({ ...form, variations: form.variations.filter((_, i) => i !== idx) });
  };
  const addVariationOption = (varIdx) => {
    const newVars = form.variations.map((v, i) => i === varIdx ? { ...v, options: [...v.options, { value: '', sizes: [{ size: '', quantity: '' }] }] } : v);
    setForm({ ...form, variations: newVars });
  };
  const removeVariationOption = (varIdx, optIdx) => {
    const newVars = form.variations.map((v, i) => {
      if (i !== varIdx) return v;
      return { ...v, options: v.options.filter((_, j) => j !== optIdx) };
    });
    setForm({ ...form, variations: newVars });
  };

  const handleSizeChange = (idx, field, value) => {
    const newSizes = form.sizes.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setForm({ ...form, sizes: newSizes });
  };

  const addSizeField = () => {
    setForm({ ...form, sizes: [...form.sizes, { size: '', quantity: '' }] });
  };

  const removeSizeField = (idx) => {
    setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (product) {
        // Edit
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
        if (form.variations && form.variations.some(v => v.name)) {
          putData.variations = form.variations
            .filter(v => v.name)
            .map(v => ({ name: v.name, options: v.options.filter(o => o) }));
        } else {
          putData.variations = [];
        }
        // For edit: send info about which existing images to keep, and new images to upload
        const data = new FormData();
        data.append('name', form.name);
        data.append('description', form.description);
        data.append('price', form.price);
        data.append('category', form.category);
        data.append('flashSale', form.flashSale);
        data.append('bestSelling', form.bestSelling);
        if (form.sizes && form.sizes.some(s => s.size && s.quantity)) {
          data.append('sizes', form.sizes.filter(s => s.size && s.quantity).map(s => `${s.size}:${s.quantity}`).join(','));
        }
        if (form.variations && form.variations.some(v => v.name)) {
          data.append('variations', JSON.stringify(form.variations.filter(v => v.name).map(v => ({ name: v.name, options: v.options.filter(o => o) }))));
        }
        if (form.stock) data.append('stock', form.stock);
        // Keep only selected existing images
        if (form.existingImages && form.existingImages.length > 0) {
          form.existingImages.forEach(img => data.append('existingImages', img));
        }
        // Add new images
        if (form.images && form.images.length > 0) {
          form.images.forEach(img => data.append('images', img));
        }
        await API.put(`/products/${product._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Product updated successfully!');
      } else {
        // Add
        const data = new FormData();
        data.append('name', form.name);
        data.append('description', form.description);
        data.append('price', form.price);
        data.append('category', form.category);
        data.append('flashSale', form.flashSale);
        data.append('bestSelling', form.bestSelling);
        if (form.images && form.images.length > 0) {
          form.images.forEach(img => data.append('images', img));
        }
        if (form.sizes && form.sizes.some(s => s.size && s.quantity)) {
          data.append('sizes', form.sizes.filter(s => s.size && s.quantity).map(s => `${s.size}:${s.quantity}`).join(','));
        }
        if (form.variations && form.variations.some(v => v.name)) {
          // Send as JSON string
          data.append('variations', JSON.stringify(form.variations.filter(v => v.name).map(v => ({ name: v.name, options: v.options.filter(o => o) }))));
        }
        if (form.stock) data.append('stock', form.stock);
        await API.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage('Product created successfully!');
      }
      setLoading(false);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save product');
      setLoading(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit} style={{ minWidth: 350, maxWidth: 500 }}>
      <h2 style={{ marginBottom: 16 }}>{product ? 'Edit Product' : 'Add New Product'}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>Name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Price</label>
        <input type="number" name="price" value={form.price} onChange={handleChange} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Category</label>
        <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%' }}>
          {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Stock (for products without variations)</label>
        <input type="number" name="stock" value={form.stock} onChange={handleChange} min={0} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Variations</label>
        {form.variations.map((v, vIdx) => (
          <div key={vIdx} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                placeholder="Variation name (e.g. Color)"
                value={v.name}
                onChange={e => handleVariationNameChange(vIdx, e.target.value)}
                style={{ width: 140 }}
              />
              {form.variations.length > 1 && (
                <button type="button" onClick={() => removeVariation(vIdx)}>- Remove</button>
              )}
            </div>
            <div style={{ marginTop: 6, marginLeft: 8 }}>
              {v.options.map((opt, oIdx) => (
                <div key={oIdx} style={{ marginBottom: 8, border: '1px dashed #aaa', padding: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {/* Option field removed as requested */}
                    {v.options.length > 1 && (
                      <button type="button" onClick={() => removeVariationOption(vIdx, oIdx)}>-</button>
                    )}
                    {oIdx === v.options.length - 1 && (
                      <button type="button" onClick={() => addVariationOption(vIdx)}>+</button>
                    )}
                  </div>
                  <div style={{ marginLeft: 16 }}>
                    <label>Sizes & Stock for this option:</label>
                    {opt.sizes.map((s, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <input type="text" placeholder="Size (e.g. S)" value={s.size} onChange={e => handleVariationOptionSizeChange(vIdx, oIdx, sIdx, 'size', e.target.value)} style={{ width: 60 }} />
                        <input type="number" placeholder="Quantity" min={0} value={s.quantity} onChange={e => handleVariationOptionSizeChange(vIdx, oIdx, sIdx, 'quantity', e.target.value)} style={{ width: 80 }} />
                        {opt.sizes.length > 1 && <button type="button" onClick={() => removeVariationOptionSize(vIdx, oIdx, sIdx)}>-</button>}
                        {sIdx === opt.sizes.length - 1 && <button type="button" onClick={() => addVariationOptionSize(vIdx, oIdx)}>+</button>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={addVariation}>+ Add Variation</button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Images (up to 5)</label>
        <input type="file" name="images" accept="image/*" multiple onChange={handleChange} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Existing images from server */}
          {form.existingImages && form.existingImages.map((img, idx) => (
            <div key={"existing-"+idx} style={{ border: '1px solid #ccc', padding: 2, position: 'relative' }}>
              <img src={`http://localhost:5000/uploads/${img}`} alt={`existing-${idx}`} style={{ width: 60, height: 60, objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => {
                  const newImgs = form.existingImages.filter((_, i) => i !== idx);
                  setForm({ ...form, existingImages: newImgs });
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  lineHeight: '18px',
                  padding: 0
                }}
                title="Remove image"
              >×</button>
            </div>
          ))}
          {/* New images (local) */}
          {form.images && form.images.length > 0 && Array.from(form.images).map((img, idx) => (
            <div key={"new-"+idx} style={{ border: '1px solid #ccc', padding: 2, position: 'relative' }}>
              <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} style={{ width: 60, height: 60, objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => {
                  const newImgs = Array.from(form.images).filter((_, i) => i !== idx);
                  setForm({ ...form, images: newImgs });
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  lineHeight: '18px',
                  padding: 0
                }}
                title="Remove image"
              >×</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label><input type="checkbox" name="flashSale" checked={form.flashSale} onChange={handleChange} /> Flash Sale</label>
        <label style={{ marginLeft: '1rem' }}><input type="checkbox" name="bestSelling" checked={form.bestSelling} onChange={handleChange} /> Best Selling</label>
      </div>
      <button type="submit" disabled={loading} style={{ marginRight: 10 }}>{loading ? (product ? 'Saving...' : 'Creating...') : (product ? 'Save Changes' : 'Create Product')}</button>
      <button type="button" onClick={onClose}>Cancel</button>
      {message && <p style={{ marginTop: '1rem', color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
    </form>
  );
}

export default ProductForm;
