#!/bin/bash

# 酒水管理系统部署脚本
echo "🚀 开始部署酒水管理系统..."

# 配置变量（根据实际路径修改）
PROJECT_DIR="/www/wwwroot/wine-storage-system"
BACKUP_DIR="/www/backup/wine-storage"
SERVICE_NAME="wine-storage-backend"

# 创建备份
echo "📋 创建备份..."
mkdir -p $BACKUP_DIR
mongodump --db wine-storage --out $BACKUP_DIR/$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "备份失败，但继续部署..."

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop $SERVICE_NAME 2>/dev/null || true

# 更新代码（如果使用Git）
echo "📥 更新代码..."
cd $PROJECT_DIR || exit 1

# 检查是否有Git更新，如果没有更新则跳过部署
if [ -d ".git" ]; then
    # 获取当前提交ID
    CURRENT_COMMIT=$(git rev-parse HEAD)

    # 拉取最新代码
    git fetch origin
    REMOTE_COMMIT=$(git rev-parse origin/main)

    if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo "🔍 没有新的更新，跳过部署"
        pm2 start $SERVICE_NAME 2>/dev/null || true
        exit 0
    fi

    echo "📥 发现更新，开始拉取..."
    git pull origin main

    if [ $? -ne 0 ]; then
        echo "❌ Git拉取失败！"
        pm2 start $SERVICE_NAME 2>/dev/null || true
        exit 1
    fi
else
    echo "⚠️  不是Git仓库，跳过代码更新"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend || exit 1
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败！"
    cd $PROJECT_DIR
    pm2 start $SERVICE_NAME 2>/dev/null || true
    exit 1
fi

# 构建前端
echo "🔨 构建前端..."
cd ../frontend || exit 1

# 清理旧的build目录，避免.user.ini冲突
# if [ -d "build" ]; then
#     echo "🧹 清理旧的构建文件..."
#     rm -rf build
# fi

# 安装依赖并构建
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败！"
    cd $PROJECT_DIR
    pm2 start $SERVICE_NAME 2>/dev/null || true
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败！"
    cd $PROJECT_DIR
    pm2 start $SERVICE_NAME 2>/dev/null || true
    exit 1
fi

# 检查构建是否成功
if [ ! -d "build" ]; then
    echo "❌ 前端构建失败！"
    cd $PROJECT_DIR
    pm2 start $SERVICE_NAME 2>/dev/null || true
    exit 1
fi

echo "✅ 前端构建成功"

# 重启服务
echo "🔄 重启后端服务..."
cd ../backend || exit 1
pm2 start server.js --name $SERVICE_NAME --watch 2>/dev/null || pm2 restart $SERVICE_NAME
pm2 save

# 检查服务是否启动成功
sleep 3
if ! pm2 show $SERVICE_NAME > /dev/null 2>&1; then
    echo "❌ 后端服务启动失败！"
    exit 1
fi

# 重启Nginx
echo "🔄 重启Nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✅ Nginx配置正确，已重载"
else
    echo "❌ Nginx配置错误！"
    exit 1
fi

echo "✅ 部署完成！"
echo "🌐 请访问您的域名查看效果"

# 清理旧备份（保留最近10次）
find $BACKUP_DIR -maxdepth 1 -type d -name "20*" | sort -r | tail -n +11 | xargs rm -rf 2>/dev/null

echo "🧹 已清理旧备份文件"
