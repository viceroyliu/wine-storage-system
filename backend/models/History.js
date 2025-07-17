const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    wineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wine',
        required: true
    },
    wineName: {
        type: String,
        required: true
    },
    // 操作类型：入库/出库/更新库存
    action: {
        type: String,
        enum: ['stock_in', 'stock_out', 'update_stock'],
        required: true
    },
    // 操作详情
    details: {
        // 操作前的数据
        before: {
            unpackagedBoxes: Number,
            packagedBoxes: Number,
            remainingWater: Number
        },
        // 操作后的数据
        after: {
            unpackagedBoxes: Number,
            packagedBoxes: Number,
            remainingWater: Number
        },
        // 变化量
        change: {
            unpackagedBoxes: Number,
            packagedBoxes: Number,
            remainingWater: Number
        }
    },
    // 备注
    remark: {
        type: String,
        default: ''
    },
    // 操作用户
    operator: {
        type: String,
        required: true
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('History', historySchema);
