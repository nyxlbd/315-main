import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h1 className="navbar-title">Pine City Made</h1>
          <span className="navbar-badge">Seller Panel</span>
        </div>

        <div className="navbar-actions">
          <button className="navbar-notification">
            <Bell className="w-5 h-5" />
            <span className="notification-badge"></span>
          </button>

          <div className="navbar-user">
            <div className="navbar-user-info">
              <p className="navbar-user-name">{user?.shopName || user?.username}</p>
              <p className="navbar-user-email">{user?.email}</p>
            </div>
            <div className="navbar-avatar">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>

          <button onClick={logout} className="navbar-logout">
            <LogOut className="w-4 h-4" />
            <span className="navbar-logout-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;