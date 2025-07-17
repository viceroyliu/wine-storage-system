const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        console.log('正在连接MongoDB...');

        // 连接数据库，增加更多选项
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-storage', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5秒超时
            socketTimeoutMS: 45000, // 45秒socket超时
        });

        console.log('✅ 已连接到数据库');

        // 获取命令行参数
        const username = process.argv[2];
        const password = process.argv[3];

        if (!username || !password) {
            console.log('❌ 使用方法: node createAdmin.js <用户名> <密码>');
            console.log('例如: node createAdmin.js admin 123456');
            process.exit(1);
        }

        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log(`⚠️  用户 "${username}" 已存在`);

            // 询问是否更新密码
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log('是否要更新现有用户的密码？输入 yes 确认，其他任意键取消:');
            return new Promise((resolve) => {
                rl.question('> ', async (answer) => {
                    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                        existingUser.password = password;
                        await existingUser.save();
                        console.log(`✅ 用户 "${username}" 密码已更新`);
                    } else {
                        console.log('❌ 操作已取消');
                    }
                    rl.close();
                    resolve();
                });
            });
        } else {
            // 创建新用户
            const user = new User({
                username,
                password
            });

            await user.save();
            console.log(`✅ 管理员用户 "${username}" 创建成功`);
        }

    } catch (error) {
        console.error('❌ 操作失败:', error.message);

        // 提供更详细的错误信息
        if (error.name === 'MongooseServerSelectionError') {
            console.error('🔍 MongoDB连接失败，请检查:');
            console.error('1. MongoDB服务是否正在运行: systemctl status mongod');
            console.error('2. MongoDB端口是否监听: netstat -tulpn | grep 27017');
            console.error('3. 防火墙设置是否正确');
            console.error('4. 连接字符串是否正确:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-storage');
        }
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔐 数据库连接已关闭');
        }
        process.exit(0);
    }
};

createAdmin();
