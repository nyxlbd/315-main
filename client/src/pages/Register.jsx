

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Register.css';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { ...form, role: form.role.toLowerCase() };
      await authAPI.register(payload);
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      console.error('Registration error:', err.response || err);
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="register-form-group">
          <label>Username</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required className="register-form-input" />
        </div>
        <div className="register-form-group">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="register-form-input" />
        </div>
        <div className="register-form-group">
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className="register-form-input" />
        </div>
        <div className="register-form-group">
          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="register-form-input">
            <option value="customer">Client</option>
            <option value="seller">Seller</option>
          </select>
        </div>
        <button type="submit">Register</button>
      </form>
      {message && (
        <p className={`register-form-message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>
      )}
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}

export default Register;
