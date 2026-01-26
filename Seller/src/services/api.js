import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (credentials) => {
    // Only send email and password for login
    const { email, password } = credentials;
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.user && res.data.user._id) {
      localStorage.setItem('userId', res.data.user._id);
    }
    return res;
  },
  register: (userData) => api.post('/auth/register', { ...userData, role: 'seller' }),
  getProfile: () => api.get('/auth/me'),
};

export const sellerAPI = {
  getDashboard: () => api.get('/seller/dashboard'),
  getProducts: (filters) => api.get('/seller/products', { params: filters }),
  getOrders: (filters) => api.get('/seller/orders', { params: filters }),
  getReviews: (filters) => api.get('/seller/reviews', { params: filters }),
  getConversations: () => api.get('messages/conversations'),
  getMessages: (userId) => api.get(`/messages/conversation/${userId}`),
  sendMessage: (data) => api.post('/messages/send', data),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
  replyToReview: (reviewId, data) => api.post(`/reviews/${reviewId}/reply`, data),
  updateProfile: (data) => api.put('/seller/profile', data),
  deleteProduct: (id) => api.delete(`/seller/products/${id}`),
};

export const productsAPI = {
  getAll: (filters) => api.get('/products', { params: filters }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => {
    // If FormData, create a new request without Content-Type header (browser will set it with boundary)
    if (data instanceof FormData) {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      return axios.post(`${API_URL}/products`, data, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type - browser will set it with boundary
        },
      });
    }
    return api.post('/products', data);
  },
  update: (id, data) => {
    // If FormData, create a new request without Content-Type header (browser will set it with boundary)
    if (data instanceof FormData) {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      return axios.put(`${API_URL}/products/${id}`, data, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type - browser will set it with boundary
        },
      });
    }
    return api.put(`products/${id}`, data);
  },
  delete: (id) => api.delete(`products/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;
