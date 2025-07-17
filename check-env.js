const fs = require('fs');
const path = require('path');

console.log('🔍 检查系统环境...\n');

// 检查Node.js版本
const nodeVersion = process.version;
console.log(`✅ Node.js版本: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 16) {
    console.log('⚠️  建议使用Node.js 16或更高版本');
}

// 检查必要文件
const requiredFiles = [
    'backend/package.json',
    'backend/server.js',
    'backend/.env',
    'frontend/package.json',
    'frontend/src/App.js'
];

console.log('\n📁 检查项目文件:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件缺失`);
    }
});

// 检查依赖
console.log('\n📦 检查依赖安装:');

// 后端依赖
if (fs.existsSync('backend/node_modules')) {
    console.log('✅ 后端依赖已安装');
} else {
    console.log('❌ 后端依赖未安装，请运行: cd backend && npm install');
}

// 前端依赖
if (fs.existsSync('frontend/node_modules')) {
    console.log('✅ 前端依赖已安装');
} else {
    console.log('❌ 前端依赖未安装，请运行: cd frontend && npm install');
}

// 检查环境变量
console.log('\n🔧 检查环境配置:');
if (fs.existsSync('backend/.env')) {
    const envContent = fs.readFileSync('backend/.env', 'utf8');

    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    requiredEnvVars.forEach(envVar => {
        if (envContent.includes(envVar)) {
            console.log(`✅ ${envVar} 已配置`);
        } else {
            console.log(`❌ ${envVar} 未配置`);
        }
    });
} else {
    console.log('❌ .env文件不存在');
}

console.log('\n🎯 环境检查完成！');
console.log('💡 如果发现问题，请根据提示进行修复。');
