import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, User, Mail, Lock, Phone, Building, AlertCircle } from 'lucide-react';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    shopDescription: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-header">
          <div className="register-logo">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="register-title">Become a Seller</h1>
          <p className="register-subtitle">Join Pine City Made marketplace</p>
        </div>

        <div className="register-card">
          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <p className="error-text">{error}</p>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><User className="input-icon" /></span>
                  Username
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><Mail className="input-icon" /></span>
                  Email Address
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="john@seller.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><Lock className="input-icon" /></span>
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><Lock className="input-icon" /></span>
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><Building className="input-icon" /></span>
                  Shop Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="John's Handicrafts"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon"><Phone className="input-icon" /></span>
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon"><Store className="input-icon" /></span>
                Shop Description
              </label>
              <textarea
                name="shopDescription"
                value={formData.shopDescription}
                onChange={handleChange}
                rows="3"
                className="form-textarea"
                placeholder="Tell customers about your shop..."
              ></textarea>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating Account...' : 'Create Seller Account'}
            </button>
          </form>

          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="register-footer-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;