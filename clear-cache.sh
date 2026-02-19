#!/bin/bash

# 清除应用缓存和localStorage
# 用于测试启动行为

echo "Clearing application cache..."

# 清除Electron userData
USER_DATA_PATH="$HOME/Library/Application Support/Electron"
if [ -d "$USER_DATA_PATH" ]; then
  echo "Clearing Electron user data..."
  rm -rf "$USER_DATA_PATH/user-data"
  rm -f "$USER_DATA_PATH/recent-projects.json"
  echo "✓ Electron user data cleared"
fi

# 清除localStorage (需要在浏览器开发者工具中手动执行)
echo ""
echo "To clear localStorage in the running app:"
echo "1. Open DevTools (Cmd+Option+I)"
echo "2. Go to Console tab"
echo "3. Run: localStorage.clear()"
echo "4. Reload the app (Cmd+R)"

echo ""
echo "Done! Restart the app to test."
