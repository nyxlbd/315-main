



import React, { useEffect, useState } from 'react';
import API from '../api';
import { getUserRole, isAuthenticated } from '../auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';


function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  // Determine section from route
  const path = location.pathname;
  let initialSection = 'users';
  if (path === '/admin/products') initialSection = 'products';
  const [section, setSection] = useState(initialSection);

  // Sync section with route
  useEffect(() => {
    if (path === '/admin/products') setSection('products');
    else setSection('users');
  }, [path]);

  useEffect(() => {
    if (getUserRole() !== 'admin') {
      setError('Access denied. Admins only.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [usersRes, productsRes] = await Promise.all([
          API.get('/admin/users'),
          API.get('/admin/products'),
        ]);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (err) {
        setError('Failed to fetch data.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch {
      alert('Failed to delete user.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/admin/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch {
      alert('Failed to delete product.');
    }
  };

  if (!isAuthenticated()) return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>
      <p>Please log in as admin.</p>
    </div>
  );
  if (loading) return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>
      <p>Loading...</p>
    </div>
  );
  if (error) return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>
      <p className="admin-panel-error">{error}</p>
    </div>
  );

  return (
    <div className="admin-panel-container admin-panel-main-layout">
      <h2>Admin Panel</h2>
      <div className="admin-panel-content">
        {section === 'users' && (
          <div>
            <h3>Users</h3>
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Last Logged In</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(users) && users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name || '-'}</td>
                      <td>{user.email}</td>
                      <td>{user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : '-'}</td>
                      <td>{user.role}</td>
                      <td>
                        <button className="admin-user-delete-btn" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {section === 'products' && (
          <div>
            <h3>Products</h3>
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(products) && products.map(product => (
                    <tr key={product._id}>
                      <td>
                        <img src={product.images?.[0] ? `http://localhost:5000/uploads/${product.images[0]}` : 'https://via.placeholder.com/60'} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                      </td>
                      <td>{product.name}</td>
                      <td>${product.price}</td>
                      
                      <td>
                        <button className="admin-user-delete-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default AdminPanel;
