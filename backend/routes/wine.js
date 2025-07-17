const express = require('express');
const Wine = require('../models/Wine');
const History = require('../models/History');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有在库酒水列表
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = { status: 'in_stock' }; // 只显示在库酒水

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ];
        }

        const wines = await Wine.find(query).sort({ updatedAt: -1 });
        res.json(wines);
    } catch (error) {
        console.error('获取酒水列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个酒水详情
router.get('/:id', async (req, res) => {
    try {
        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }
        res.json(wine);
    } catch (error) {
        console.error('获取酒水详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 创建新酒水（入库）
router.post('/', async (req, res) => {
    try {
        const { name, type, unpackagedBoxes = 0, packagedBoxes = 0, remainingWater = 0, remark = '' } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: '酒水名称和类型是必填项' });
        }

        const wine = new Wine({
            name,
            type,
            unpackagedBoxes: Number(unpackagedBoxes),
            packagedBoxes: Number(packagedBoxes),
            remainingWater: Number(remainingWater),
            status: 'in_stock'
        });

        await wine.save();

        // 记录历史
        const history = new History({
            wineId: wine._id,
            wineName: wine.name,
            action: 'stock_in',
            details: {
                before: { unpackagedBoxes: 0, packagedBoxes: 0, remainingWater: 0 },
                after: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                },
                change: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                }
            },
            remark,
            operator: req.user.username
        });

        await history.save();

        res.status(201).json({ message: '酒水入库成功', wine });
    } catch (error) {
        console.error('创建酒水错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 酒水入库（增加库存）
router.put('/:id/stock-in', async (req, res) => {
    try {
        const { unpackagedBoxes = 0, packagedBoxes = 0, remainingWater = 0, remark = '' } = req.body;

        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }

        // 记录入库前的数据
        const beforeData = {
            unpackagedBoxes: wine.unpackagedBoxes,
            packagedBoxes: wine.packagedBoxes,
            remainingWater: wine.remainingWater
        };

        // 增加库存
        wine.unpackagedBoxes += Number(unpackagedBoxes);
        wine.packagedBoxes += Number(packagedBoxes);
        wine.remainingWater += Number(remainingWater);
        wine.status = 'in_stock';

        await wine.save();

        // 记录历史
        const history = new History({
            wineId: wine._id,
            wineName: wine.name,
            action: 'stock_in',
            details: {
                before: beforeData,
                after: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                },
                change: {
                    unpackagedBoxes: Number(unpackagedBoxes),
                    packagedBoxes: Number(packagedBoxes),
                    remainingWater: Number(remainingWater)
                }
            },
            remark,
            operator: req.user.username
        });

        await history.save();

        res.json({ message: '入库成功', wine });
    } catch (error) {
        console.error('酒水入库错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新酒水库存
router.put('/:id', async (req, res) => {
    try {
        const { unpackagedBoxes, packagedBoxes, remainingWater, remark = '' } = req.body;

        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }

        // 记录更新前的数据
        const beforeData = {
            unpackagedBoxes: wine.unpackagedBoxes,
            packagedBoxes: wine.packagedBoxes,
            remainingWater: wine.remainingWater
        };

        // 更新数据（允许为空，保持原值）
        if (unpackagedBoxes !== undefined) wine.unpackagedBoxes = Number(unpackagedBoxes);
        if (packagedBoxes !== undefined) wine.packagedBoxes = Number(packagedBoxes);
        if (remainingWater !== undefined) wine.remainingWater = Number(remainingWater);

        await wine.save();

        // 记录历史
        const history = new History({
            wineId: wine._id,
            wineName: wine.name,
            action: 'update_stock',
            details: {
                before: beforeData,
                after: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                },
                change: {
                    unpackagedBoxes: wine.unpackagedBoxes - beforeData.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes - beforeData.packagedBoxes,
                    remainingWater: wine.remainingWater - beforeData.remainingWater
                }
            },
            remark,
            operator: req.user.username
        });

        await history.save();

        res.json({ message: '库存更新成功', wine });
    } catch (error) {
        console.error('更新酒水错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 酒水出库
router.put('/:id/stock-out', async (req, res) => {
    try {
        const { unpackagedBoxes = 0, packagedBoxes = 0, remainingWater = 0, remark = '' } = req.body;

        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }

        // 检查库存是否足够
        if (wine.unpackagedBoxes < Number(unpackagedBoxes) ||
            wine.packagedBoxes < Number(packagedBoxes) ||
            wine.remainingWater < Number(remainingWater)) {
            return res.status(400).json({ message: '库存不足' });
        }

        // 记录出库前的数据
        const beforeData = {
            unpackagedBoxes: wine.unpackagedBoxes,
            packagedBoxes: wine.packagedBoxes,
            remainingWater: wine.remainingWater
        };

        // 减少库存
        wine.unpackagedBoxes -= Number(unpackagedBoxes);
        wine.packagedBoxes -= Number(packagedBoxes);
        wine.remainingWater -= Number(remainingWater);

        await wine.save();

        // 记录历史
        const history = new History({
            wineId: wine._id,
            wineName: wine.name,
            action: 'stock_out',
            details: {
                before: beforeData,
                after: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                },
                change: {
                    unpackagedBoxes: -Number(unpackagedBoxes),
                    packagedBoxes: -Number(packagedBoxes),
                    remainingWater: -Number(remainingWater)
                }
            },
            remark,
            operator: req.user.username
        });

        await history.save();

        res.json({ message: '出库成功', wine });
    } catch (error) {
        console.error('酒水出库错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除酒水
router.delete('/:id', async (req, res) => {
    try {
        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }

        await Wine.findByIdAndDelete(req.params.id);

        res.json({ message: '酒水删除成功' });
    } catch (error) {
        console.error('删除酒水错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 酒水罐装接口
router.put('/:id/package', async (req, res) => {
    try {
        const { packagedBoxes, remainingWater, remark = '' } = req.body;

        const wine = await Wine.findById(req.params.id);
        if (!wine) {
            return res.status(404).json({ message: '酒水不存在' });
        }

        if (wine.status === 'out_of_stock') {
            return res.status(400).json({ message: '该酒水已出库，无法进行罐装操作' });
        }

        const addPackaged = Number(packagedBoxes) || 0;

        // 验证罐装数量
        if (addPackaged <= 0) {
            return res.status(400).json({ message: '罐装数量必须大于0' });
        }

        if (addPackaged > wine.unpackagedBoxes) {
            return res.status(400).json({ message: `罐装数量不能大于未罐装箱数(${wine.unpackagedBoxes})` });
        }

        // 记录更新前的数据
        const beforeData = {
            unpackagedBoxes: wine.unpackagedBoxes,
            packagedBoxes: wine.packagedBoxes,
            remainingWater: wine.remainingWater
        };

        // 更新数据
        wine.unpackagedBoxes = wine.unpackagedBoxes - addPackaged;
        wine.packagedBoxes = wine.packagedBoxes + addPackaged;

        // 如果提供了新的剩余水量，则更新
        if (remainingWater !== undefined) {
            wine.remainingWater = Number(remainingWater);
        }

        await wine.save();

        // 记录历史
        const history = new History({
            wineId: wine._id,
            wineName: wine.name,
            action: 'update_stock',
            details: {
                before: beforeData,
                after: {
                    unpackagedBoxes: wine.unpackagedBoxes,
                    packagedBoxes: wine.packagedBoxes,
                    remainingWater: wine.remainingWater
                },
                change: {
                    unpackagedBoxes: -addPackaged,
                    packagedBoxes: addPackaged,
                    remainingWater: (remainingWater !== undefined) ? (wine.remainingWater - beforeData.remainingWater) : 0
                }
            },
            remark: remark || '新增罐装',
            operator: req.user.username
        });

        await history.save();

        res.json({
            message: '罐装操作成功',
            wine,
            packaged: addPackaged
        });
    } catch (error) {
        console.error('罐装操作错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});


module.exports = router;
