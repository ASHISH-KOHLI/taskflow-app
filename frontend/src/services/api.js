import axios from 'axios';

// The API URL comes from environment variable
// In Docker Compose: REACT_APP_API_URL=http://localhost:4000
// In Kubernetes:     REACT_APP_API_URL=http://backend-service:4000
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - log every outgoing request
apiClient.interceptors.request.use((config) => {
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || error.message;
    console.error('❌ API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export const tasksApi = {
  getAll:  (params)   => apiClient.get('/api/tasks', { params }),
  getById: (id)       => apiClient.get(`/api/tasks/${id}`),
  create:  (data)     => apiClient.post('/api/tasks', data),
  update:  (id, data) => apiClient.put(`/api/tasks/${id}`, data),
  delete:  (id)       => apiClient.delete(`/api/tasks/${id}`),
};

export const healthApi = {
  check: () => apiClient.get('/health'),
};
