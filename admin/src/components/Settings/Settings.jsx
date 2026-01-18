import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Artisan Market',
    siteEmail: 'admin@artisanmarket.com',
    currency: 'PHP',
    commissionRate: 10,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings logic here
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure platform settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h2 className="section-title">General Settings</h2>
          
          <div className="form-group">
            <label className="form-label">Site Name</label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              name="siteEmail"
              value={settings.siteEmail}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Currency</label>
            <select
              name="currency"
              value={settings.currency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Commission Rate (%)</label>
            <input
              type="number"
              name="commissionRate"
              value={settings.commissionRate}
              onChange={handleChange}
              min="0"
              max="100"
              className="form-input"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">System Settings</h2>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="enableNotifications"
                checked={settings.enableNotifications}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span>Enable Email Notifications</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span>Maintenance Mode</span>
            </label>
            <p className="form-help">Enable this to take the platform offline for maintenance</p>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
