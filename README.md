# 酒水管理系统 - 宝塔面板部署指南

## 项目概述

这是一个基于 React + Node.js + MongoDB 的移动端酒水库存管理系统，支持酒水入库出库、库存管理、历史记录等功能。

**技术栈：** React 18 + Ant Design Mobile + Node.js + Express + MongoDB

---

## 部署前准备

### 服务器要求
- 阿里云服务器（推荐2核4G以上）
- 宝塔面板已安装
- 域名已备案并解析到服务器

### 本地开发测试
项目提供了两个重要脚本文件用于不同场景：

#### 1. `start.sh` - 本地开发启动脚本
**用途：** 在本地环境快速启动前后端服务进行开发测试

**使用方法：**
```bash
# 给脚本执行权限
chmod +x start.sh

# 首次运行（会自动创建管理员账户）
./start.sh --create-admin

# 后续开发运行
./start.sh
```

**功能说明：**
- 自动检查Node.js和MongoDB环境
- 自动安装前后端依赖
- 同时启动后端服务(端口5000)和前端开发服务(端口3000)
- 可选择创建默认管理员账户（用户名：admin，密码：123456）
- 支持Ctrl+C优雅停止服务

#### 2. `deploy.sh` - 生产环境部署脚本
**用途：** 在服务器上自动化部署和更新系统

**使用方法：**
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

**功能说明：**
- 自动备份MongoDB数据库
- 从Git仓库拉取最新代码
- 安装生产环境依赖
- 构建前端静态文件
- 使用PM2重启后端服务
- 重载Nginx配置

---

## 宝塔面板部署详细步骤

### 第一步：服务器环境准备

#### 1. 登录宝塔面板
访问服务器IP:8888，使用宝塔账号密码登录

#### 2. 安装必要软件
在宝塔面板 → **软件商店** → **运行环境** 中安装：

| 软件名称 | 版本要求 | 说明 |
|---------|---------|------|
| **Node.js版本管理器** | 最新版 | JavaScript运行环境 |
| **MongoDB** | 4.0+ | NoSQL数据库 |
| **Nginx** | 最新版 | Web服务器 |
| **PM2管理器** | 最新版 | Node.js进程管理 |

#### 3. 配置Node.js版本
- 进入 **Node.js** → **版本管理**
- 安装 **Node.js 16** 或 **Node.js 18** 版本

### 第二步：上传项目代码

#### 方法一：文件上传（适合小项目）

1. **本地打包项目**
```bash
# 在本地项目根目录执行
tar -czf wine-storage-system.tar.gz wine-storage-system/
```

2. **上传到服务器**
- 宝塔面板 → **文件** → 进入 `/www/wwwroot/`
- 点击 **上传** → 选择 `wine-storage-system.tar.gz`
- 右键解压文件

#### 方法二：Git部署（推荐）

1. **安装Git工具**
- 软件商店 → **系统工具** → 安装 **Git**

2. **克隆项目代码**
```bash
# 在宝塔终端中执行
cd /www/wwwroot/
git clone https://github.com/yourusername/wine-storage-system.git
```

### 第三步：MongoDB数据库配置

#### 1. 启动MongoDB服务
- 宝塔面板 → **数据库** → **MongoDB** → 点击 **启动**

#### 2. 创建项目数据库
在宝塔终端中执行：
```bash
mongo
use wine-storage
db.createCollection("wines")
db.createCollection("users")
db.createCollection("histories")
exit
```

### 第四步：后端服务部署

#### 1. 配置环境变量
在 `/www/wwwroot/wine-storage-system/backend/` 目录创建 `.env` 文件：

```env
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/wine-storage
JWT_SECRET=your-super-secret-production-key-2024-wine-storage
PORT=5000
```
阿里云服务器>安全组，放开27017；
宝塔面板>安全，同样放开27017

#### 2. 安装依赖并创建管理员
```bash
cd /www/wwwroot/wine-storage-system/backend
npm install --production

# 创建管理员账户
node scripts/createAdmin.js admin 123456
```

#### 3. 配置PM2启动
- 宝塔面板 → **Node.js** → **添加Node.js项目**
- **项目路径：** `/www/wwwroot/wine-storage-system/backend`
- **启动文件：** `server.js`
- **项目端口：** `5000`
- 点击 **提交** 并 **启动**

### 第五步：前端项目构建

#### 1. 修改前端API配置
编辑 `/www/wwwroot/wine-storage-system/frontend/.env` 文件：

```env
# 生产环境API地址
REACT_APP_API_URL=https://wine.iojun.com/api
REACT_APP_NAME=酒水管理系统
REACT_APP_VERSION=1.0.0
```

#### 2. 构建前端项目
```bash
cd /www/wwwroot/wine-storage-system/frontend
npm install
npm run build
```

构建完成后，静态文件会生成在 `build/` 目录中。

### 第六步：配置Nginx网站

#### 1. 添加站点
- 宝塔面板 → **网站** → **PHP项目** → **添加站点**
- **域名：** `wine.iojun.com`
- **根目录：** `/www/wwwroot/wine-storage-system/frontend/build`
- **PHP版本：** 纯静态

#### 2. 申请免费SSL证书
- 网站设置 → **SSL** → **Let's Encrypt**
- 输入域名：`wine.iojun.com`
- 点击 **申请**

#### 3. 开启强制HTTPS
- SSL页面 → 开启 **强制HTTPS**

### 第七步：配置反向代理

点击站点 → **设置** → **配置文件**，替换为以下配置：

```nginx
server
{
    listen 80;
    listen 443 ssl;
    # 开启SSL后，才可以启用http2
    http2 on;
    server_name wine.iojun.com;
    index index.html;
    root /www/wwwroot/wine-storage-system/frontend/build;

    # SSL证书配置（申请成功后会自动生成这些路径）
    ssl_certificate    /www/server/panel/vhost/cert/wine.iojun.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/wine.iojun.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;
    
    #CERT-APPLY-CHECK--START
    # 用于SSL证书申请时的文件验证相关配置 -- 请勿删除
    include /www/server/panel/vhost/nginx/well-known/wine.iojun.com.conf;
    #CERT-APPLY-CHECK--END

    #SSL-START SSL相关配置，请勿删除或修改下一行带注释的404规则
    #error_page 404/404.html;
    
    #HTTP_TO_HTTPS_START
    set $isRedcert 1;
    if ($server_port != 443) {
        set $isRedcert 2;
    }
    if ( $uri ~ /\.well-known/ ) {
        set $isRedcert 1;
    }
    if ($isRedcert != 1) {
        rewrite ^(/.*)$ https://$host$1 permanent;
    }
    #HTTP_TO_HTTPS_END

    # HTTP自动跳转HTTPS

    # 前端单页应用路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 禁用缓存，确保更新及时生效
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # API接口反向代理
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存优化
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 安全设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 禁止访问敏感文件
    location ~ /\.ht {
        deny all;
    }
    
    location ~ /\.(git|env|DS_Store) {
        deny all;
    }

    # 日志文件
    access_log  /www/wwwlogs/wine.iojun.com.log;
    error_log   /www/wwwlogs/wine.iojun.com.error.log;
}
```


### 第八步：设置自动部署

#### 1. 将部署脚本上传到服务器
将项目中的 `deploy.sh` 文件上传到 `/www/wwwroot/wine-storage-system/` 目录

#### 2. 修改部署脚本路径
根据实际情况修改脚本中的路径

#### 3. 设置脚本权限并测试
```bash
chmod +x /www/wwwroot/wine-storage-system/deploy.sh

# 测试部署
cd /www/wwwroot/wine-storage-system
./deploy.sh
```
以后每次直接用命令部署即可，不需要每次都重新配置一次。

### 第九步：防火墙和安全配置

#### 1. 开放必要端口
- 宝塔面板 → **安全** → **防火墙**
- 放行端口：`80`, `443`, `5000`

#### 2. 设置宝塔面板安全
- **面板设置** → **安全** → 修改面板端口（默认8888）
- **面板设置** → **安全** → 绑定域名或IP
- **面板设置** → **安全** → 设置复杂面板密码

### 第十步：设置定时任务（可选）

#### 1. 数据库自动备份
- 宝塔面板 → **计划任务** → **添加任务**
- **任务类型：** Shell脚本
- **任务名称：** 酒水系统每月自动部署
- **执行周期：** 每月 - 1日 - 02:30 执行
- **脚本内容：**
```bash
#!/bin/bash
# 酒水管理系统每月自动部署任务

# 强制设置环境变量
export PATH="/www/server/nodejs/v16.20.2/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_PATH="/www/server/nodejs/v16.20.2/lib/node_modules"

# 项目路径
PROJECT_DIR="/www/wwwroot/wine-storage-system"
LOG_FILE="/www/wwwlogs/wine-auto-deploy.log"

# 创建日志目录（如果不存在）
mkdir -p /www/wwwlogs

# 函数：记录日志
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"  # 同时输出到控制台
}

# 记录开始时间
log_message "开始自动部署任务"

# 检查Node.js是否可用
if command -v node >/dev/null 2>&1; then
    log_message "Node.js版本: $(node --version)"
else
    log_message "错误：Node.js未找到"
    # 尝试其他可能的Node.js路径
    for node_path in /www/server/nodejs/*/bin; do
        if [ -d "$node_path" ]; then
            export PATH="$node_path:$PATH"
            log_message "尝试使用Node.js路径: $node_path"
            break
        fi
    done
fi

# 检查npm是否可用
if command -v npm >/dev/null 2>&1; then
    log_message "npm可用"
else
    log_message "错误：npm未找到"
fi

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    log_message "错误：项目目录不存在 $PROJECT_DIR"
    exit 1
fi

log_message "项目目录存在: $PROJECT_DIR"

# 进入项目目录
cd "$PROJECT_DIR" || {
    log_message "错误：无法进入项目目录"
    exit 1
}

log_message "已进入项目目录: $(pwd)"

# 检查deploy.sh脚本
if [ -f "./deploy.sh" ]; then
    log_message "找到部署脚本: ./deploy.sh"
    
    # 设置执行权限
    chmod +x ./deploy.sh
    log_message "已设置执行权限"
    
    # 执行部署脚本并捕获输出
    log_message "开始执行部署脚本..."
    
    if timeout 1800 ./deploy.sh >> "$LOG_FILE" 2>&1; then
        log_message "自动部署成功"
    else
        exit_code=$?
        log_message "自动部署失败，退出码: $exit_code"
    fi
else
    log_message "错误：找不到部署脚本 ./deploy.sh"
    log_message "当前目录内容:"
    ls -la >> "$LOG_FILE" 2>&1
fi

log_message "自动部署任务结束"
```

#### 2. 清理系统日志
- **任务名称：** 清理系统日志
- **执行周期：** 每周日 03:00
- **脚本内容：**
```bash
#!/bin/bash
# 清理Nginx日志（保留最近7天）
find /www/wwwlogs/ -name "*.log" -mtime +7 -delete
# 清理PM2日志
pm2 flush
```

---

## 部署测试验证

### 1. 检查服务状态
```bash
# 检查PM2进程
pm2 list

# 检查MongoDB状态
systemctl status mongod

# 检查Nginx状态
systemctl status nginx

# 检查端口监听
netstat -tulpn | grep :5000
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### 2. 功能测试
1. 访问 https://wine.iojun.com
2. 使用默认账号登录：
    - 用户名：`admin`
    - 密码：`123456`
3. 测试添加酒水功能
4. 测试库存管理功能
5. 查看历史记录

### 3. API接口测试
```bash
# 测试API连通性
curl https://wine.iojun.com/api/auth/verify

# 应该返回401未授权错误，说明API正常
```

---

## 日常维护和管理

### 1. 常用维护命令

```bash
# 查看后端服务状态
pm2 status

# 重启后端服务
pm2 restart wine-storage-backend

# 查看后端日志
pm2 logs wine-storage-backend

# 查看网站访问日志
tail -f /www/wwwlogs/wine.iojun.com.log

# 查看错误日志
tail -f /www/wwwlogs/wine.iojun.com.error.log

# 手动备份数据库
mongodump --db wine-storage --out /www/backup/wine-storage/manual-$(date +%Y%m%d)
```

### 2. 系统更新部署

当有代码更新时，使用部署脚本：

```bash
cd /www/wwwroot/wine-storage-system
./deploy.sh
```

### 3. 数据库管理

```bash
# 进入MongoDB命令行
mongo

# 选择数据库
use wine-storage

# 查看所有集合
show collections

# 查看用户数据
db.users.find()

# 查看酒水数据
db.wines.find()

# 退出
exit
```

---

## 常见问题排查

### 1. 网站无法访问

**检查步骤：**
```bash
# 1. 检查Nginx状态
systemctl status nginx

# 2. 检查域名解析
nslookup wine.iojun.com

# 3. 检查防火墙
iptables -L

# 4. 检查Nginx配置
nginx -t
```

### 2. API接口500错误

**排查方法：**
```bash
# 1. 查看后端日志
pm2 logs wine-storage-backend

# 2. 检查数据库连接
mongo --eval "db.adminCommand('ismaster')"

# 3. 重启后端服务
pm2 restart wine-storage-backend
```

### 3. 前端页面空白

**解决方案：**
```bash
# 1. 检查构建文件
ls -la /www/wwwroot/wine-storage-system/frontend/build/

# 2. 重新构建前端
cd /www/wwwroot/wine-storage-system/frontend
npm run build

# 3. 检查Nginx配置中的root路径
```

### 4. MongoDB连接失败

**解决步骤：**
```bash
# 1. 启动MongoDB
systemctl start mongod

# 2. 检查MongoDB状态
systemctl status mongod

# 3. 查看MongoDB日志
journalctl -u mongod

# 4. 检查配置文件
cat /etc/mongod.conf
```

---

## 性能优化建议

### 1. 服务器配置优化
- 建议使用2核4G以上配置
- 开启SSD存储提升数据库性能
- 配置CDN加速静态资源

### 2. 数据库优化
```javascript
// 为常用查询字段创建索引
db.wines.createIndex({ "name": 1 })
db.wines.createIndex({ "status": 1 })
db.histories.createIndex({ "createdAt": -1 })
```

### 3. Nginx优化
```nginx
# 开启gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 设置worker进程数
worker_processes auto;
```

---

## 安全建议

### 1. 系统安全
- 定期更新系统和软件包
- 使用强密码和密钥认证
- 限制SSH访问IP白名单
- 定期检查安全日志

### 2. 应用安全
- 及时修改默认管理员密码
- 定期备份重要数据
- 监控异常访问日志
- 保持依赖包最新版本

### 3. 数据安全
- 设置数据库访问密码
- 启用MongoDB认证
- 定期异地备份数据
- 加密敏感数据传输

---

## 联系支持

如果在部署过程中遇到问题：

1. **查看错误日志：** 根据错误信息定位问题
2. **检查配置文件：** 确认所有配置项正确
3. **重启相关服务：** 有时重启可以解决问题
4. **查阅官方文档：** 参考相关技术栈官方文档

---

**部署完成后，你的酒水管理系统将在 https://wine.iojun.com 正常运行！**

记住默认登录信息：
- 👤 用户名：`admin`
- 🔑 密码：`123456`

**⚠️ 重要提醒：首次登录后请立即修改默认密码确保系统安全！**
