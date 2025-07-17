const express = require('express');
const History = require('../models/History');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取历史记录列表
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            action,
            search,
            startDate,
            endDate
        } = req.query;

        let query = {};

        // 按操作类型筛选
        if (action && action !== 'all') {
            query.action = action;
        }

        // 按酒水名称模糊搜索
        if (search && search.trim()) {
            query.wineName = { $regex: search.trim(), $options: 'i' };
        }

        // 按时间范围筛选
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // 设置为当天的23:59:59
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endOfDay;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [histories, total] = await Promise.all([
            History.find(query)
                .populate('wineId', 'name type')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            History.countDocuments(query)
        ]);

        res.json({
            histories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取历史记录错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个历史记录详情
router.get('/:id', async (req, res) => {
    try {
        const history = await History.findById(req.params.id)
            .populate('wineId', 'name type status');

        if (!history) {
            return res.status(404).json({ message: '历史记录不存在' });
        }

        res.json(history);
    } catch (error) {
        console.error('获取历史记录详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取操作统计
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let matchQuery = {};
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) {
                matchQuery.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                matchQuery.createdAt.$lte = new Date(endDate);
            }
        }

        const stats = await History.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    latestOperation: { $max: '$createdAt' }
                }
            }
        ]);

        const actionNames = {
            'stock_in': '入库',
            'stock_out': '出库',
            'update_stock': '库存更新',
        };

        const formattedStats = stats.map(stat => ({
            action: stat._id,
            actionName: actionNames[stat._id] || stat._id,
            count: stat.count,
            latestOperation: stat.latestOperation
        }));

        res.json(formattedStats);
    } catch (error) {
        console.error('获取操作统计错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});


// 清空历史记录（仅管理员）
router.delete('/clear-all', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;

        // 检查是否为管理员
        if (req.user.username !== 'admin') {
            return res.status(403).json({ message: '权限不足，仅管理员可清空历史记录' });
        }

        if (!password) {
            return res.status(400).json({ message: '请输入密码确认操作' });
        }

        // 验证管理员密码
        const User = require('../models/User');
        const admin = await User.findById(req.user._id);
        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: '密码错误' });
        }

        // 清空所有历史记录
        const result = await History.deleteMany({});

        res.json({
            message: '历史记录已清空',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('清空历史记录错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;

