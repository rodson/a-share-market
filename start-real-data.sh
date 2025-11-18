#!/bin/bash

echo "🚀 启动 A股市场数据系统（真实数据模式）"
echo "================================================"

# 检查Python环境
echo "📋 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

echo "✅ Python3: $(python3 --version)"

# 检查AKShare是否安装
echo "📋 检查AKShare..."
if ! python3 -c "import akshare" &> /dev/null; then
    echo "⚠️  AKShare 未安装"
    read -p "是否现在安装 AKShare? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 安装 AKShare..."
        pip3 install akshare pandas -i https://pypi.tuna.tsinghua.edu.cn/simple
        if [ $? -ne 0 ]; then
            echo "❌ AKShare 安装失败"
            exit 1
        fi
        echo "✅ AKShare 安装成功"
    else
        echo "❌ 需要安装 AKShare 才能使用真实数据"
        exit 1
    fi
else
    echo "✅ AKShare 已安装"
fi

# 给Python脚本添加执行权限
chmod +x server/akshare-fetch.py

# 停止旧进程
echo ""
echo "🛑 停止旧进程..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 启动后端服务器（真实数据模式）
echo ""
echo "🔧 启动后端服务器（真实数据模式）..."
cd "$(dirname "$0")"
USE_REAL_DATA=true node server/index.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 测试后端
echo ""
echo "🧪 测试后端服务..."
HEALTH_CHECK=$(curl -s http://localhost:3002/api/health)
if echo "$HEALTH_CHECK" | grep -q "success"; then
    echo "✅ 后端服务运行正常"
    echo "   数据源: $(echo $HEALTH_CHECK | python3 -c "import sys, json; print(json.load(sys.stdin).get('dataSource', 'unknown'))")"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo ""
echo "🎨 启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "✅ 系统启动成功！"
echo ""
echo "📊 访问地址："
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3002"
echo ""
echo "📝 进程信息："
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⚠️  数据模式: 真实数据（AKShare）"
echo ""
echo "🛑 停止服务: Ctrl+C 或执行"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "================================================"

# 等待用户中断
wait
