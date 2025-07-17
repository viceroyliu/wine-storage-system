import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import Router from './components/Router';
import AuthContext from './contexts/AuthContext';
import { getToken, removeToken } from './utils/auth';
import { verifyToken } from './services/api';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = getToken();
            if (token) {
                const response = await verifyToken();
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Token验证失败:', error);
            removeToken();
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        removeToken();
    };

    if (loading) {
        return (
            <div className="app-container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontSize: '16px',
                    color: '#666'
                }}>
                    加载中...
                </div>
            </div>
        );
    }

    return (
        <ConfigProvider locale={zhCN}>
            <AuthContext.Provider value={{ user, login, logout }}>
                <div className="app-container">
                    <Router />
                </div>
            </AuthContext.Provider>
        </ConfigProvider>
    );
}

export default App;
