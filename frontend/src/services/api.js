import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

// 配置API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 认证相关API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    verifyToken: () => api.get('/auth/verify'),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// 酒水管理API
export const wineAPI = {
    getWines: (params) => api.get('/wine', { params }),
    getWine: (id) => api.get(`/wine/${id}`),
    createWine: (data) => api.post('/wine', data),
    updateWine: (id, data) => api.put(`/wine/${id}`, data),
    stockIn: (id, data) => api.put(`/wine/${id}/stock-in`, data),
    stockOut: (id, data) => api.put(`/wine/${id}/stock-out`, data),
    packageWine: (id, data) => api.put(`/wine/${id}/package`, data), // 新增罐装API
    deleteWine: (id) => api.delete(`/wine/${id}`),
};

// 历史记录API
export const historyAPI = {
    getHistories: (params) => api.get('/history', { params }),
    getHistory: (id) => api.get(`/history/${id}`),
    getStats: (params) => api.get('/history/stats/summary', { params }),
    clearHistory: (data) => api.delete('/history/clear-all', { data }), // 新增清空历史记录API
};

// 用户管理API
export const userAPI = {
    createUser: (data) => api.post('/auth/create-user', data),
    getUsers: () => api.get('/auth/users'),
    deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// 导出便捷方法
export const login = authAPI.login;
export const verifyToken = authAPI.verifyToken;
export const changePassword = authAPI.changePassword;

export default api;
