import React, { useState, useContext } from 'react';
import {
    Card,
    List,
    Button,
    Dialog,
    Form,
    Input,
    Toast,
    Space,
    Selector
} from 'antd-mobile';
import {
    UserOutline,
    LockOutline,
    CloseCircleOutline,
    UserAddOutline,
    DeleteOutline,
    MinusCircleOutline,
    EyeInvisibleOutline,
    EyeOutline
} from 'antd-mobile-icons';
import AuthContext from '../contexts/AuthContext';
import { changePassword, userAPI, historyAPI } from '../services/api';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [createUserVisible, setCreateUserVisible] = useState(false);
    const [deleteUserVisible, setDeleteUserVisible] = useState(false);
    const [clearHistoryVisible, setClearHistoryVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [userForm] = Form.useForm();
    const [clearHistoryForm] = Form.useForm();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showClearPassword, setShowClearPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [deleteUserLoading, setDeleteUserLoading] = useState(false);
    const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // 检查是否为管理员
    const isAdmin = user?.username === 'admin';

    // 加载用户列表
    const loadUsers = async () => {
        try {
            const response = await userAPI.getUsers();
            const filteredUsers = response.data.filter(u => u.username !== 'admin');
            setUsers(filteredUsers);
        } catch (error) {
            console.error('加载用户列表失败:', error);
            Toast.show({
                icon: 'fail',
                content: '加载用户列表失败'
            });
        }
    };

    const handleChangePassword = async (values) => {
        try {
            setLoading(true);

            if (values.newPassword !== values.confirmPassword) {
                Toast.show({
                    icon: 'fail',
                    content: '两次输入的新密码不一致'
                });
                return;
            }

            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });

            // 关闭对话框并重置表单
            setChangePasswordVisible(false);
            passwordForm.resetFields();

            // 显示成功提示并在1.5秒后自动退出登录
            Toast.show({
                icon: 'success',
                content: '密码修改成功，即将退出登录...',
                duration: 1500
            });

            // 1.5秒后自动退出登录
            setTimeout(() => {
                logout();
                // 再次提示用户使用新密码登录
                Toast.show({
                    icon: 'success',
                    content: '请使用新密码重新登录',
                    duration: 3000
                });
            }, 1500);

        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '密码修改失败'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (values) => {
        try {
            setCreateUserLoading(true);

            await userAPI.createUser({
                username: values.username
            });

            Toast.show({
                icon: 'success',
                content: '用户创建成功，默认密码：123456'
            });

            setCreateUserVisible(false);
            userForm.resetFields();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '用户创建失败'
            });
        } finally {
            setCreateUserLoading(false);
        }
    };

    const handleDeleteUserClick = async () => {
        if (!isAdmin) {
            Toast.show({ content: '仅管理员可使用此功能' });
            return;
        }

        await loadUsers();
        setDeleteUserVisible(true);
    };

    const handleDeleteUser = async () => {
        if (!selectedUserId) {
            Toast.show({
                icon: 'fail',
                content: '请选择要删除的用户'
            });
            return;
        }

        const selectedUser = users.find(u => u._id === selectedUserId);

        const result = await Dialog.confirm({
            content: `确定要删除用户 "${selectedUser?.username}" 吗？此操作不可恢复！`,
            confirmText: '删除',
            cancelText: '取消',
            closeOnMaskClick: true
        });

        if (!result) return;

        try {
            setDeleteUserLoading(true);

            await userAPI.deleteUser(selectedUserId);

            Toast.show({
                icon: 'success',
                content: '用户删除成功'
            });

            setDeleteUserVisible(false);
            setSelectedUserId(null);
            await loadUsers();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '用户删除失败'
            });
        } finally {
            setDeleteUserLoading(false);
        }
    };

    const handleClearHistory = async (values) => {
        try {
            setClearHistoryLoading(true);

            await historyAPI.clearHistory({
                password: values.password
            });

            Toast.show({
                icon: 'success',
                content: '历史记录已清空'
            });

            setClearHistoryVisible(false);
            clearHistoryForm.resetFields();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '清空失败'
            });
        } finally {
            setClearHistoryLoading(false);
        }
    };

    const handleLogout = async () => {
        const result = await Dialog.confirm({
            content: '确定要退出登录吗？',
            confirmText: '退出',
            cancelText: '取消',
            closeOnMaskClick: true
        });

        if (result) {
            logout();
            Toast.show({
                icon: 'success',
                content: '已退出登录'
            });
        }
    };

    const userInfo = [
        {
            key: 'username',
            label: '用户名',
            value: user?.username || '--',
            icon: <UserOutline />
        },
        {
            key: 'role',
            label: '用户角色',
            value: isAdmin ? '管理员' : '普通用户',
            icon: <UserOutline />
        },
        {
            key: 'loginTime',
            label: '登录时间',
            value: new Date().toLocaleString(),
            icon: <UserOutline />
        }
    ];

    const userOptions = users.map(user => ({
        label: `${user.username} (创建于: ${new Date(user.createdAt).toLocaleDateString()})`,
        value: user._id
    }));

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
            {/* 用户信息卡片 */}
            <Card style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: isAdmin
                            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginRight: '16px'
                    }}>
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                            {user?.username || '未知用户'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            {isAdmin ? '系统管理员' : '酒水管理系统用户'}
                        </div>
                    </div>
                </div>

                <List>
                    {userInfo.map(item => (
                        <List.Item
                            key={item.key}
                            prefix={item.icon}
                            extra={
                                <span style={{
                                    color: item.key === 'role' && isAdmin ? '#ff4d4f' : '#666',
                                    fontWeight: item.key === 'role' && isAdmin ? '500' : 'normal'
                                }}>
                  {item.value}
                </span>
                            }
                        >
                            {item.label}
                        </List.Item>
                    ))}
                </List>
            </Card>

            {/* 功能菜单 */}
            <Card style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    账户管理
                </div>

                <List>
                    <List.Item
                        prefix={<LockOutline />}
                        onClick={() => setChangePasswordVisible(true)}
                        clickable
                    >
                        修改密码
                    </List.Item>

                    <List.Item
                        prefix={<UserAddOutline />}
                        onClick={() => isAdmin ? setCreateUserVisible(true) : Toast.show({ content: '仅管理员可使用此功能' })}
                        clickable
                        disabled={!isAdmin}
                        style={{
                            opacity: isAdmin ? 1 : 0.5,
                            cursor: isAdmin ? 'pointer' : 'not-allowed'
                        }}
                        extra={isAdmin ? null : <span style={{ fontSize: '12px', color: '#999' }}>仅管理员</span>}
                    >
                        新增用户
                    </List.Item>

                    {/* 删除用户功能 - 只有admin可见 */}
                    {isAdmin && (
                        <List.Item
                            prefix={<DeleteOutline />}
                            onClick={handleDeleteUserClick}
                            clickable
                            style={{ color: '#ff4d4f' }}
                        >
                            <span style={{ color: '#ff4d4f' }}>删除用户</span>
                        </List.Item>
                    )}

                    {/* 清空历史记录功能 - 只有admin可见 */}
                    {isAdmin && (
                        <List.Item
                            prefix={<MinusCircleOutline />}
                            onClick={() => setClearHistoryVisible(true)}
                            clickable
                            style={{ color: '#ff4d4f' }}
                        >
                            <span style={{ color: '#ff4d4f' }}>清空历史记录</span>
                        </List.Item>
                    )}
                </List>
            </Card>

            {/* 系统信息 */}
            <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    系统信息
                </div>

                <List>
                    <List.Item extra="v1.0.0">
                        版本号
                    </List.Item>
                    <List.Item extra="React + Node.js">
                        技术栈
                    </List.Item>
                    <List.Item extra="酒水库存管理">
                        系统类型
                    </List.Item>
                </List>
            </Card>

            {/* 退出登录按钮 */}
            <Button
                block
                color='danger'
                fill='outline'
                size='large'
                onClick={handleLogout}
                style={{ borderRadius: '12px' }}
            >
                <CloseCircleOutline /> 退出登录
            </Button>

            {/* 修改密码对话框 */}
            <Dialog
                visible={changePasswordVisible}
                title='修改密码'
                closeOnMaskClick={true}
                onClose={() => {
                    setChangePasswordVisible(false);
                    passwordForm.resetFields();
                }}
                content={
                    <Form
                        form={passwordForm}
                        onFinish={handleChangePassword}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%', marginTop: '20px' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => {
                                        setChangePasswordVisible(false);
                                        passwordForm.resetFields();
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    block
                                    color='primary'
                                    type='submit'
                                    loading={loading}
                                >
                                    确认修改
                                </Button>
                            </Space>
                        }
                    >
                        <Form.Item
                            name='currentPassword'
                            label='当前密码'
                            rules={[
                                { required: true, message: '请输入当前密码' }
                            ]}
                        >
                            <Input
                                placeholder='请输入当前密码'
                                type={showCurrentPassword ? 'text' : 'password'}
                                suffix={
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                                    </div>
                                }
                                style={{
                                    '--border-radius': '8px'
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name='newPassword'
                            label='新密码'
                            rules={[
                                { required: true, message: '请输入新密码' },
                                { min: 6, message: '密码至少需要6个字符' }
                            ]}
                        >
                            <Input
                                placeholder='请输入新密码（至少6位）'
                                type={showNewPassword ? 'text' : 'password'}
                                suffix={
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                                    </div>
                                }
                                style={{
                                    '--border-radius': '8px'
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name='confirmPassword'
                            label='确认新密码'
                            rules={[
                                { required: true, message: '请确认新密码' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                })
                            ]}
                        >
                            <Input
                                placeholder='请再次输入新密码'
                                type={showConfirmPassword ? 'text' : 'password'}
                                suffix={
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                                    </div>
                                }
                                style={{
                                    '--border-radius': '8px'
                                }}
                            />
                        </Form.Item>

                        <div style={{
                            background: '#fff7e6',
                            border: '1px solid #ffd591',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#d46b08',
                            marginTop: '16px'
                        }}>
                            ⚠️ 重要提醒：
                            <br />• 密码修改成功后将自动退出登录
                            <br />• 需要使用新密码重新登录系统
                            <br />• 建议使用字母、数字组合确保安全
                        </div>
                    </Form>
                }
            />

            {/* 新增用户对话框 */}
            <Dialog
                visible={createUserVisible}
                title='新增用户'
                closeOnMaskClick={true}
                onClose={() => {
                    setCreateUserVisible(false);
                    userForm.resetFields();
                }}
                content={
                    <Form
                        form={userForm}
                        onFinish={handleCreateUser}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%', marginTop: '20px' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => {
                                        setCreateUserVisible(false);
                                        userForm.resetFields();
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    block
                                    color='primary'
                                    type='submit'
                                    loading={createUserLoading}
                                >
                                    创建用户
                                </Button>
                            </Space>
                        }
                    >
                        <Form.Item
                            name='username'
                            label='用户名'
                            rules={[
                                { required: true, message: '请输入用户名' },
                                { min: 3, message: '用户名至少需要3个字符' },
                                { max: 20, message: '用户名不能超过20个字符' },
                                {
                                    pattern: /^[a-zA-Z0-9_]+$/,
                                    message: '用户名只能包含字母、数字和下划线'
                                }
                            ]}
                        >
                            <Input
                                placeholder='请输入新用户的用户名'
                                clearable
                                style={{
                                    '--border-radius': '8px'
                                }}
                            />
                        </Form.Item>

                        <div style={{
                            background: '#fff7e6',
                            border: '1px solid #ffd591',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#fa8c16',
                            marginTop: '16px'
                        }}>
                            📢 重要提醒：
                            <br />• 新用户默认密码为：<strong>123456</strong>
                            <br />• 建议用户首次登录后及时修改密码
                            <br />• 用户名创建后无法修改，请谨慎填写
                        </div>
                    </Form>
                }
            />

            {/* 删除用户对话框 */}
            <Dialog
                visible={deleteUserVisible}
                title='删除用户'
                closeOnMaskClick={true}
                onClose={() => {
                    setDeleteUserVisible(false);
                    setSelectedUserId(null);
                }}
                content={
                    <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            请选择要删除的用户：
                        </div>

                        {users.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                color: '#999',
                                fontSize: '14px'
                            }}>
                                暂无可删除的用户
                            </div>
                        ) : (
                            <>
                                <Selector
                                    options={userOptions}
                                    value={selectedUserId ? [selectedUserId] : []}
                                    onChange={(value) => setSelectedUserId(value[0])}
                                    style={{ marginBottom: '16px' }}
                                />

                                <div style={{
                                    background: '#fff2f0',
                                    border: '1px solid #ffccc7',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '12px',
                                    color: '#ff4d4f',
                                    marginBottom: '16px'
                                }}>
                                    ⚠️ 危险操作提醒：
                                    <br />• 删除用户后无法恢复
                                    <br />• 被删除用户将无法登录系统
                                    <br />• 无法删除管理员账户
                                </div>

                                <Space style={{ width: '100%' }}>
                                    <Button
                                        block
                                        fill='outline'
                                        onClick={() => {
                                            setDeleteUserVisible(false);
                                            setSelectedUserId(null);
                                        }}
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        block
                                        color='danger'
                                        onClick={handleDeleteUser}
                                        loading={deleteUserLoading}
                                        disabled={!selectedUserId}
                                    >
                                        确认删除
                                    </Button>
                                </Space>
                            </>
                        )}
                    </div>
                }
            />

            {/* 清空历史记录对话框 */}
            <Dialog
                visible={clearHistoryVisible}
                title='清空历史记录'
                closeOnMaskClick={true}
                onClose={() => {
                    setClearHistoryVisible(false);
                    clearHistoryForm.resetFields();
                }}
                content={
                    <Form
                        form={clearHistoryForm}
                        onFinish={handleClearHistory}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%', marginTop: '20px' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => {
                                        setClearHistoryVisible(false);
                                        clearHistoryForm.resetFields();
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    block
                                    color='danger'
                                    type='submit'
                                    loading={clearHistoryLoading}
                                >
                                    确认清空
                                </Button>
                            </Space>
                        }
                    >
                        <div style={{
                            background: '#fff2f0',
                            border: '1px solid #ffccc7',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#ff4d4f',
                            marginBottom: '16px'
                        }}>
                            ⚠️ 危险操作警告：
                            <br />• 此操作将清空所有历史记录
                            <br />• 清空后无法恢复任何历史数据
                            <br />• 请确保您真的需要执行此操作
                        </div>

                        <Form.Item
                            name='password'
                            label='管理员密码'
                            rules={[
                                { required: true, message: '请输入管理员密码确认操作' }
                            ]}
                        >
                            <Input
                                placeholder='请输入管理员密码'
                                type={showClearPassword ? 'text' : 'password'}
                                suffix={
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowClearPassword(!showClearPassword)}
                                    >
                                        {showClearPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                                    </div>
                                }
                                style={{
                                    '--border-radius': '8px'
                                }}
                            />
                        </Form.Item>

                        <div style={{
                            background: '#fffbe6',
                            border: '1px solid #ffe58f',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#d46b08',
                            marginTop: '16px'
                        }}>
                            💡 操作说明：
                            <br />• 需要输入当前管理员密码进行确认
                            <br />• 清空后系统将重新开始记录历史
                            <br />• 建议在清空前做好数据备份
                        </div>
                    </Form>
                }
            />
        </div>
    );
};

export default Profile;
