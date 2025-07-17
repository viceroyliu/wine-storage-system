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
cd $PROJECT_DIR
git pull origin main  # 如果不使用Git，注释这行

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install --production

# 构建前端
echo "🔨 构建前端..."
cd ../frontend

# 清理旧的build目录，避免.user.ini冲突
# if [ -d "build" ]; then
#     echo "🧹 清理旧的构建文件..."
#     rm -rf build
# fi

# 安装依赖并构建
npm install
npm run build

# 检查构建是否成功
if [ ! -d "build" ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi

echo "✅ 前端构建成功"

# 重启服务
echo "🔄 重启后端服务..."
cd ../backend
pm2 start server.js --name $SERVICE_NAME --watch 2>/dev/null || pm2 restart $SERVICE_NAME
pm2 save

# 重启Nginx
echo "🔄 重启Nginx..."
nginx -t && systemctl reload nginx

echo "✅ 部署完成！"
echo "🌐 请访问您的域名查看效果"
