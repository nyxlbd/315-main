import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { User, Store, Phone, MapPin, Mail, Calendar, Edit2 } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    shopName: '',
    shopDescription: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        shopName: user.shopName || '',
        shopDescription: user.shopDescription || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sellerAPI.updateProfile(formData);
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingSpinner size="large" />;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="profile-grid">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {user.shopName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'S'}
              </div>
            </div>
            <h2 className="profile-name">{user.shopName || user.username}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Personal Information</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-edit">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shop Name</label>
                    <input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group form-row-full">
                    <label className="form-label">Shop Description</label>
                    <textarea
                      name="shopDescription"
                      value={formData.shopDescription}
                      onChange={handleChange}
                      rows="3"
                      className="form-textarea"
                    ></textarea>
                  </div>

                  <div className="form-group form-row-full">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="form-textarea"
                    ></textarea>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-save"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <p className="profile-info-label">
                    <User className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Username
                  </p>
                  <p className="profile-info-value">{user.username}</p>
                </div>

                <div className="profile-info-item">
                  <p className="profile-info-label">
                    <Mail className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Email
                  </p>
                  <p className="profile-info-value">{user.email}</p>
                </div>

                <div className="profile-info-item">
                  <p className="profile-info-label">
                    <Store className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Shop Name
                  </p>
                  <p className="profile-info-value">{user.shopName || 'Not set'}</p>
                </div>

                <div className="profile-info-item">
                  <p className="profile-info-label">
                    <Phone className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Phone
                  </p>
                  <p className="profile-info-value">{user.phone || 'Not set'}</p>
                </div>

                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                  <p className="profile-info-label">
                    <Store className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Shop Description
                  </p>
                  <p className="profile-info-value">{user.shopDescription || 'No description'}</p>
                </div>

                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                  <p className="profile-info-label">
                    <MapPin className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Address
                  </p>
                  <p className="profile-info-value">
                    {user.address
                      ? typeof user.address === 'object'
                        ? (
                            user.address.country
                              ? user.address.country
                              : JSON.stringify(user.address)
                          )
                        : user.address
                      : 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
