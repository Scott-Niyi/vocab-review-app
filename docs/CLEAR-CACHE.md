# 清除缓存说明

如果看不到新添加的单词（如 intra-beltway），请按以下步骤操作：

## 方法 1: 清除 localStorage（推荐）

1. 打开浏览器开发者工具（F12 或 Cmd+Option+I）
2. 切换到 Console 标签
3. 输入以下命令并回车：
```javascript
localStorage.clear()
location.reload()
```

## 方法 2: 硬刷新浏览器

- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

## 方法 3: 清除浏览器数据

1. 打开浏览器设置
2. 找到"清除浏览数据"
3. 选择"缓存的图像和文件"以及"Cookie 和其他网站数据"
4. 点击清除

## 验证

清除后，刷新页面：
1. 点击 Library
2. 应该能看到 6 个单词（包括 intra-beltway）
3. 搜索 "intra" 或 "beltway"
4. 点击查看，应该能看到变体 "inside-the-beltway" 显示在单词下方

## 为什么需要清除？

因为应用使用 localStorage 保存数据，旧的数据会覆盖新的 mockData。清除后会重新从 mockData 加载。
