#!/bin/bash

echo "🚀 启动A股市场数据展示系统..."
echo ""

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动后端服务
echo "🔧 启动后端服务 (端口 3001)..."
npm run server &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端服务
echo "🎨 启动前端服务 (端口 3000)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔌 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
