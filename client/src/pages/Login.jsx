

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Login.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMessage('Login successful! Redirecting...');
      const role = res.data.user.role;
      let redirectTo = '/products';
      if (role === 'seller') redirectTo = '/dashboard';
      if (role === 'admin') redirectTo = '/admin';
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-centered-layout">
      <div className="login-box">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="login-form-input" />
          </div>
          <div className="login-form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className="login-form-input" />
          </div>
          <button type="submit" className="login-form-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        {message && (
          <p className={`login-form-message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>
        )}
        <div className="login-register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
