import api from './api';

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};
