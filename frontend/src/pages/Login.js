import React, { useState, useContext } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import AuthContext from '../contexts/AuthContext';
import { login } from '../services/api';

const Login = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login: authLogin } = useContext(AuthContext);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const response = await login(values);
            const { token, user } = response.data;

            authLogin(user, token);
            Toast.show({
                icon: 'success',
                content: '登录成功',
            });
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '登录失败',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '20px',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '32px 24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: '8px'
                    }}>
                        酒水管理系统
                    </h1>
                    <p style={{
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        请输入您的账号密码登录
                    </p>
                </div>

                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout='vertical'
                    footer={
                        <Button
                            block
                            type='submit'
                            color='primary'
                            loading={loading}
                            size='large'
                            style={{
                                marginTop: '24px',
                                borderRadius: '8px',
                                height: '48px'
                            }}
                        >
                            登录
                        </Button>
                    }
                >
                    <Form.Item
                        name='username'
                        label='用户名'
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input
                            placeholder='请输入用户名'
                            style={{
                                '--border-radius': '8px',
                                '--border-color': '#d9d9d9',
                                '--font-size': '16px',
                                '--placeholder-color': '#bfbfbf'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name='password'
                        label='密码'
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input
                            placeholder='请输入密码'
                            type={showPassword ? 'text' : 'password'}
                            suffix={
                                <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                                </div>
                            }
                            style={{
                                '--border-radius': '8px',
                                '--border-color': '#d9d9d9',
                                '--font-size': '16px',
                                '--placeholder-color': '#bfbfbf'
                            }}
                        />
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Login;
