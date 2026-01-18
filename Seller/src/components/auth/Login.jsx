import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Branding */}
        <div className="login-branding">
          <div className="login-logo" style={{ background: 'white' }}>
            <Store size={120} color="#538E5E" />
          </div>
          <h1 className="login-brand-title">Pine City Made</h1>
          <p className="login-brand-subtitle">
            Empowering Local Artisans of Baguio City
          </p>
        </div>
        {/* Right Form */}
        <div className="login-form-side">
          <div className="login-header">
            <h2 className="login-title">Log in</h2>
            <p className="login-subtitle">
              Let us explore the rich culture of the City of Pines
            </p>
          </div>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                />
                <span>Show Password</span>
              </label>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Log In'}
            </button>

            {/* Demo credentials box
            <div className="demo-credentials">
              <div className="demo-title">TEST CREDENTIALS</div>
              <div className="demo-box">
                Email: john@seller.com<br />
                Password: seller123
              </div>
            </div> */}
          </form>
          <div className="login-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-footer-link">
              Register as Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;