import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, User, LogOut } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">Pine City Made Admin</h1>
      </div>

      <div className="navbar-right">
        <button className="navbar-icon-btn" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="user-menu">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username || 'admin'}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
