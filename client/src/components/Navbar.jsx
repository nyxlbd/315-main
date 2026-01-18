
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole, logout } from '../auth';
import './Navbar.css';

function Navbar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isAuthenticated();
  const role = getUserRole();

  // Show search bar on landing page for all users
  const showSearch = location.pathname === '/';

  const handleSearch = (e) => {
    e.preventDefault();
    // For now, just reload landing with search param
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Pine City Made</Link>
      </div>
      <ul className="navbar-links">
        
        {!loggedIn && location.pathname !== '/login' && location.pathname !== '/register' && (
          <>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/login">Login</Link></li>
          </>
        )}
        {loggedIn && role === 'admin' && (
          <li><Link to="/admin">Admin</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
