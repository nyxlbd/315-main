import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Dashboard from './pages/Dashboard';
// import SellerProducts from './pages/SellerProducts';
// import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Messages from './pages/Messages';
// import SellerOrders from './pages/SellerOrders';
import './AppLayout.css';
// import SellerMessages from './pages/SellerMessages';
// import SellerReviews from './pages/SellerReviews';

function App() {
  // Protected route for authenticated users
  const PrivateRoute = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" />;

  // Protected route for specific roles
  const RoleRoute = ({ children, role }) =>
    isAuthenticated() && getUserRole() === role ? children : <Navigate to="/login" />;

  // Protected route for admin or seller
  const MultiRoleRoute = ({ children, roles }) =>
    isAuthenticated() && roles.includes(getUserRole()) ? children : <Navigate to="/login" />;

  return (
    <Router>
      <Navbar />
      {isAuthenticated() && <Sidebar />}
      <div className={isAuthenticated() ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          } />
          <Route path="/messages" element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          } />
          {/* Seller/Admin routes removed because files do not exist */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
