

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import './Register.css';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await API.post('/auth/register', form);
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="register-form-group">
          <label>Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="register-form-input" />
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
            <option value="client">Client</option>
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
