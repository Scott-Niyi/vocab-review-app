# 应用打包分发指南

## 快速开始

### 打包 macOS 版本
```bash
cd vocab-review-app
npm run build:mac
```

生成文件：`release/Vocab Review-1.0.0-mac-x64.dmg` 和 `release/Vocab Review-1.0.0-mac-arm64.dmg`

### 打包 Windows 版本
```bash
cd vocab-review-app
npm run build:win
```

生成文件：`release/Vocab Review-1.0.0-win-x64.exe`

### 同时打包两个平台
```bash
cd vocab-review-app
npm run build:all
```

## 打包后的文件位置

所有打包文件会生成在 `vocab-review-app/release/` 目录下：

- **macOS**: `Vocab Review-1.0.0-mac-x64.dmg` (Intel 芯片) 和 `Vocab Review-1.0.0-mac-arm64.dmg` (Apple Silicon)
- **Windows**: `Vocab Review-1.0.0-win-x64.exe`

## 功能完整性保证

打包后的应用包含所有功能：

✅ **文件系统操作**
- 读写 vocabulary.json
- 创建和管理项目文件夹
- 最近项目记录

✅ **图片存储**
- 保存图片到项目的 images 文件夹
- 读取和显示图片

✅ **日志系统**
- 写入日志到项目的 logs 文件夹
- 日志文件持久化

✅ **项目管理**
- 创建新项目
- 打开现有项目
- 导出项目

✅ **数据持久化**
- 用户数据保存在系统的 userData 目录
- macOS: `~/Library/Application Support/vocab-review-app/`
- Windows: `%APPDATA%/vocab-review-app/`

## 分发给其他用户

### macOS
1. 将 `.dmg` 文件发送给用户
2. 用户双击 `.dmg` 文件
3. 将应用拖到 Applications 文件夹
4. 首次打开可能需要在"系统偏好设置 > 安全性与隐私"中允许

### Windows
1. 将 `.exe` 文件发送给用户
2. 用户双击运行安装程序
3. 选择安装位置（默认在 Program Files）
4. 安装完成后可以从开始菜单或桌面快捷方式启动

## 注意事项

### 跨平台打包
- 在 macOS 上可以打包 macOS 和 Windows 版本
- 在 Windows 上只能打包 Windows 版本（无法打包 macOS）
- 建议在 macOS 上运行 `npm run build:all` 生成所有平台的安装包

### 文件大小
- macOS dmg: 约 100-150 MB
- Windows exe: 约 80-120 MB

### 首次运行
用户首次运行应用时：
1. 应用会自动创建用户数据目录
2. 会包含一个默认的示例项目（3个示例单词）
3. 用户可以立即开始使用或创建新项目

## 更新版本号

修改 `package.json` 中的 `version` 字段：
```json
{
  "version": "1.0.1"
}
```

然后重新打包，生成的文件名会自动包含新版本号。

## 故障排查

### 打包失败
```bash
# 清理缓存后重试
npm run clean
npm install
npm run build:mac  # 或 build:win
```

### 打包后应用无法启动
检查 `dist-electron` 和 `dist-react` 目录是否正确生成：
```bash
ls -la dist-electron/
ls -la dist-react/
```

### 功能测试清单
打包后建议测试以下功能：
- [ ] 创建新项目
- [ ] 打开现有项目
- [ ] 添加单词（包括上传图片）
- [ ] 复习单词
- [ ] 导出项目
- [ ] 重启应用后数据保留
- [ ] 最近项目列表正常显示

## 高级配置

如需修改打包配置，编辑 `package.json` 中的 `build` 部分：

- `appId`: 应用唯一标识符
- `productName`: 应用显示名称
- `mac.category`: macOS 应用分类
- `win.target`: Windows 安装包类型

详细配置参考：https://www.electron.build/configuration/configuration
