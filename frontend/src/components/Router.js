import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import Layout from './Layout';
import Login from '../pages/Login';
import WineList from '../pages/WineList';
import WineDetail from '../pages/WineDetail';
import EditWine from '../pages/EditWine'; // 修改导入名称
import History from '../pages/History';
import Profile from '../pages/Profile';

const Router = () => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="/wines" replace />} />
                    <Route path="/wines" element={<WineList />} />
                    <Route path="/wines/:id" element={<WineDetail />} />
                    <Route path="/edit-wine" element={<EditWine />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/wines" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default Router;
