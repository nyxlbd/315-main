import React from 'react';
import { Link } from 'react-router-dom';
import { getUserRole, isAuthenticated, logout } from '../auth';
import { useLocation } from 'react-router-dom';
import './Sidebar.css';


function Sidebar() {
  if (!isAuthenticated()) return null;
  const role = getUserRole();
  const location = useLocation();

  // For seller, allow tab switching if setTab is provided
  const isSeller = role === 'seller';
  const activePath = location.pathname;

  return (
    <aside className="sidebar">
      <ul className="sidebar-links">
        {role === 'client' && (
          <>
            <li><Link to="/products">Browse Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/messages">Messages</Link></li>
            <li><button className="sidebar-logout" onClick={() => { logout(); window.location.href = '/'; }}>Logout</button></li>
          </>
        )}
        {isSeller && (
          <>
            <li><Link to="/dashboard" className={activePath === '/dashboard' ? 'sidebar-link-active' : ''}>Dashboard</Link></li>
            <li><Link to="/seller/orders" className={activePath === '/seller/orders' ? 'sidebar-link-active' : ''}>Orders</Link></li>
            <li><Link to="/seller/messages" className={activePath === '/seller/messages' ? 'sidebar-link-active' : ''}>Messages</Link></li>
            <li><Link to="/seller/reviews" className={activePath === '/seller/reviews' ? 'sidebar-link-active' : ''}>Reviews</Link></li>
            <li><button className="sidebar-logout" onClick={() => { logout(); window.location.href = '/'; }}>Logout</button></li>
          </>
        )}
        {role === 'admin' && (
          <>
            <li>
              <Link to="/admin/users" className={activePath === '/admin/users' ? 'sidebar-link-active' : ''}>Users</Link>
            </li>
            <li>
              <Link to="/admin/products" className={activePath === '/admin/products' ? 'sidebar-link-active' : ''}>Products</Link>
            </li>
            <li><button className="sidebar-logout" onClick={() => { logout(); window.location.href = '/'; }}>Logout</button></li>
          </>
        )}
      </ul>
    </aside>
  );
}

export default Sidebar;
