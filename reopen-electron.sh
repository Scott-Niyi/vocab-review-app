#!/bin/bash
# 重新打开 Electron 窗口（不重启整个进程）

cd "$(dirname "$0")"

echo "🔄 重新打开 Electron 窗口..."
echo ""
echo "⚠️  注意：这需要 npm run dev 进程还在运行"
echo ""

# 检查 Vite 是否在运行
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Vite 服务器没有运行！"
    echo "请先运行: npm run dev"
    exit 1
fi

echo "✅ Vite 服务器正在运行"
echo "🚀 启动 Electron 窗口..."

# 只启动 Electron，不启动 Vite
VITE_DEV_SERVER_URL=http://localhost:5173 npx electron .
