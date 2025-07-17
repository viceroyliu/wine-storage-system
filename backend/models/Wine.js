const mongoose = require('mongoose');

const wineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    // 未罐装箱数
    unpackagedBoxes: {
        type: Number,
        default: 0,
        min: 0
    },
    // 已罐装箱数
    packagedBoxes: {
        type: Number,
        default: 0,
        min: 0
    },
    // 剩余水(桶为单位，允许小数)
    remainingWater: {
        type: Number,
        default: 0,
        min: 0
    },
    // 总库存(自动计算)
    totalStock: {
        type: Number,
        default: 0
    },
    // 状态：在库/已出库
    status: {
        type: String,
        enum: ['in_stock', 'out_of_stock'],
        default: 'in_stock'
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 更新总库存的中间件
wineSchema.pre('save', function(next) {
    this.totalStock = this.unpackagedBoxes + this.packagedBoxes;
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Wine', wineSchema);
