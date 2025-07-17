const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码都是必填项' });
        }

        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }

        // 验证密码
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 修改密码
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: '当前密码和新密码都是必填项' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: '新密码至少需要6个字符' });
        }

        const user = await User.findById(req.user._id);

        // 验证当前密码
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: '当前密码错误' });
        }

        // 更新密码
        user.password = newPassword;
        await user.save();

        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 验证令牌
router.get('/verify', authMiddleware, (req, res) => {
    res.json({
        message: '令牌有效',
        user: {
            id: req.user._id,
            username: req.user.username
        }
    });
});


// 创建新用户（仅管理员）
router.post('/create-user', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        // 检查是否为管理员
        if (req.user.username !== 'admin') {
            return res.status(403).json({ message: '权限不足，仅管理员可创建用户' });
        }

        if (!username) {
            return res.status(400).json({ message: '用户名是必填项' });
        }

        if (username.length < 3) {
            return res.status(400).json({ message: '用户名至少需要3个字符' });
        }

        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 创建新用户，默认密码123456
        const user = new User({
            username,
            password: '123456'
        });

        await user.save();

        res.json({
            message: '用户创建成功',
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('创建用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});


// 获取所有用户列表（仅管理员）
router.get('/users', authMiddleware, async (req, res) => {
    try {
        // 检查是否为管理员
        if (req.user.username !== 'admin') {
            return res.status(403).json({ message: '权限不足，仅管理员可查看用户列表' });
        }

        const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除用户（仅管理员）
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否为管理员
        if (req.user.username !== 'admin') {
            return res.status(403).json({ message: '权限不足，仅管理员可删除用户' });
        }

        // 查找要删除的用户
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 防止删除admin用户
        if (userToDelete.username === 'admin') {
            return res.status(400).json({ message: '无法删除管理员账户' });
        }

        // 防止删除自己
        if (userToDelete._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: '无法删除当前登录的账户' });
        }

        await User.findByIdAndDelete(id);

        res.json({
            message: '用户删除成功',
            deletedUser: {
                id: userToDelete._id,
                username: userToDelete.username
            }
        });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});


module.exports = router;
