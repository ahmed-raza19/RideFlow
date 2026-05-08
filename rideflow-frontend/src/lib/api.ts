import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT on every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Auto-inject token based on URL path for testing
    if (config.url?.includes('/rider/')) {
      // Rider token
      const riderToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIxLCJlbWFpbCI6InRlc3QucmlkZXJAcmlkZWZsb3cuY29tIiwicm9sZSI6IlJpZGVyIiwiaWF0IjoxNzc4MjYyNDU5LCJleHAiOjE3NzgzNDg4NTl9.WhNb1ROsz-v8kNavR-t_J9wwwC1Jx-6Dz52qKA7VEcA";
      config.headers.Authorization = `Bearer ${riderToken}`;
    } else {
      // Driver token
      const driverToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIyLCJlbWFpbCI6InRlc3QuZHJpdmVyQHJpZGVmbG93LmNvbSIsInJvbGUiOiJEcml2ZXIiLCJpYXQiOjE3NzgyNTYxMTYsImV4cCI6MTc3ODM0MjUxNn0.f602MgfyVThikS4TyPFrIPuikQHOAechstS5CeKRaxk";
      config.headers.Authorization = `Bearer ${driverToken}`;
    }
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);
