# 快速打包指南

## 第一次打包前的准备

确保你在 `vocab-review-app` 目录下：
```bash
cd vocab-review-app
```

## 打包步骤

### 方案 A: 只打包当前系统（推荐首次测试）

**如果你在 macOS 上：**
```bash
npm run build:mac
```

**如果你在 Windows 上：**
```bash
npm run build:win
```

### 方案 B: 打包所有平台（需要在 macOS 上运行）

```bash
npm run build:all
```

## 打包时间

- 首次打包：约 3-5 分钟
- 后续打包：约 1-2 分钟

## 打包完成后

查看生成的文件：
```bash
ls -la release/
```

你会看到：
- macOS: `Vocab Review-1.0.0-mac-x64.dmg` 和/或 `Vocab Review-1.0.0-mac-arm64.dmg`
- Windows: `Vocab Review-1.0.0-win-x64.exe`

## 测试打包后的应用

### macOS
1. 双击 `.dmg` 文件
2. 将应用拖到 Applications 文件夹
3. 从 Applications 文件夹启动应用
4. 测试所有功能（创建项目、添加单词、上传图片等）

### Windows
1. 双击 `.exe` 文件
2. 按照安装向导完成安装
3. 从开始菜单或桌面快捷方式启动
4. 测试所有功能

## 常见问题

### Q: 打包时报错 "Cannot find module"
```bash
npm install
npm run build:mac  # 或 build:win
```

### Q: 想重新打包
```bash
rm -rf release/
npm run build:mac  # 或 build:win
```

### Q: 打包后的应用很大
这是正常的，因为包含了：
- Electron 运行时（约 50-80 MB）
- React 应用代码
- Node.js 模块

### Q: 能在 Windows 上打包 macOS 版本吗？
不能。需要在 macOS 上才能打包 macOS 版本。
但在 macOS 上可以打包 Windows 版本。

## 分发给朋友

直接把 `release/` 目录下的文件发给他们：
- macOS 用户：发送 `.dmg` 文件
- Windows 用户：发送 `.exe` 文件

文件可以通过：
- 网盘（推荐，因为文件较大）
- 邮件（如果文件不超过附件限制）
- U盘
- 任何文件传输方式

## 下一步

如果打包成功并且所有功能正常，你可以：
1. 修改 `package.json` 中的 `author` 字段为你的名字
2. 更新 `version` 字段来发布新版本
3. 考虑添加应用图标（需要准备 .icns 和 .ico 文件）
