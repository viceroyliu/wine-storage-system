const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const wineRoutes = require('./routes/wine');
const historyRoutes = require('./routes/history');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-storage', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('已连接到MongoDB数据库');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB连接错误:', err);
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/wine', wineRoutes);
app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
