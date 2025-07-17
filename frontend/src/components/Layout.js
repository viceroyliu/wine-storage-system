import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
    AppOutline,
    EditSOutline,
    ClockCircleOutline,
    UserOutline
} from 'antd-mobile-icons';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        {
            key: '/wines',
            title: '酒水管理',
            icon: <AppOutline />
        },
        {
            key: '/edit-wine',
            title: '新增罐装',
            icon: <EditSOutline />
        },
        {
            key: '/history',
            title: '历史记录',
            icon: <ClockCircleOutline />
        },
        {
            key: '/profile',
            title: '个人中心',
            icon: <UserOutline />
        }
    ];

    return (
        <div style={{
            paddingBottom: '60px',
            minHeight: '100vh',
            background: '#f5f5f5'
        }}>
            {children}

            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'white',
                borderTop: '1px solid #f0f0f0'
            }}>
                <TabBar
                    activeKey={location.pathname}
                    onChange={(key) => navigate(key)}
                >
                    {tabs.map(item => (
                        <TabBar.Item
                            key={item.key}
                            icon={item.icon}
                            title={item.title}
                        />
                    ))}
                </TabBar>
            </div>
        </div>
    );
};

export default Layout;
