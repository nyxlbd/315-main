import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/common/Layout';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import Dashboard from './components/Dashboard/Dashboard';

// Product Components
import Products from './components/Product/Products';
import ProductForm from './components/Product/ProductForm';

// Order Components
import Orders from './components/Order/Orders';

// Review Components
import Reviews from './components/Review/Reviews';

// Message Components
import Messages from './components/Message/Messages';

// Profile Components
import Profile from './components/Profile/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />

            {/* Orders */}
            <Route path="orders" element={<Orders />} />

            {/* Reviews */}
            <Route path="reviews" element={<Reviews />} />

            {/* Messages */}
            <Route path="messages" element={<Messages />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;