import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', formData.email);
      
      const result = await login(formData);
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="login-logo-container">
            <div className="login-logo">
              <img src={logo} alt="Pine City Made Logo" style={{ width: 320, height: 320 }} />
            </div>  
            <h1 className="login-brand-title">Pine City Made</h1>
            <p className="login-brand-subtitle">Empowering Local Artisans of Baguio City</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-form-side">
          <div className="login-header">
            <h2 className="login-title">Log in</h2>
            <p className="login-subtitle">Let us explore the rich culture of the City of Pines</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
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
              <label className="form-label">Password</label>
              <input
                type={showPassword ? "text" : "password"}
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
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span>Show Password</span>
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Log In'}
            </button>

            <div className="login-footer">
              <h3>Test Credentials</h3>
              <p>Email: admin@pinecitymade.com</p>
              <p>Password: admin123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
