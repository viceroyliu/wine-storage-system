#!/bin/bash

echo "🍷 启动酒水管理系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB 未运行，正在启动..."
    # 尝试启动MongoDB（根据系统不同可能需要调整）
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    elif command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        mongod --fork --logpath /var/log/mongodb.log
    fi
fi

# 进入后端目录并启动
echo "🚀 启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查是否有管理员用户
echo "👤 检查管理员账户..."
if [ "$1" = "--create-admin" ]; then
    echo "🔐 创建管理员账户（用户名: admin, 密码: 123456）"
    node scripts/createAdmin.js admin 123456
fi

npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 进入前端目录并启动
echo "🎨 启动前端服务..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

npm start &
FRONTEND_PID=$!

echo "✅ 系统启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔗 后端API: http://localhost:5000"
echo ""
echo "⚠️  首次使用请运行: ./start.sh --create-admin"
echo "🛑 停止系统请按 Ctrl+C"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
