#!/bin/bash

# 停止旧进程
echo "Stopping old processes..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 启动后端服务器
echo "Starting backend server on port 3002..."
cd /Users/rodson/rodson/a-share-market
node server/index.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 测试后端
echo "Testing backend..."
curl -s http://localhost:3002/api/health
echo ""

# 启动前端
echo -e "\nStarting frontend on port 3000..."
npm run dev

# 当前端停止时，也停止后端
trap "kill $BACKEND_PID 2>/dev/null" EXIT
