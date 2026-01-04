import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000 // 30 seconds
});

// Optional: add a response interceptor to unwrap data consistently
axiosClient.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export default axiosClient;
