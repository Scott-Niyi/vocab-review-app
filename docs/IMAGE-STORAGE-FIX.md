# Image Storage Fix - 图片存储修复

## 问题 (Problem)

之前图片是用 base64 编码直接存在 JSON 文件里的，这样有几个问题：
- JSON 文件会变得非常大
- 不方便管理图片
- 不符合项目文件夹的标准结构

Previously, images were stored as base64 data directly in the JSON file, which caused:
- Very large JSON files
- Difficult to manage images
- Not following the standard project folder structure

## 解决方案 (Solution)

现在图片会保存到项目的 `images/` 文件夹，JSON 里只存相对路径。

Now images are saved to the project's `images/` folder, and only the relative path is stored in JSON.

### 项目结构 (Project Structure)

```
ProjectFolder/
├── vocabulary.json          # 只存图片路径 (only stores image paths)
├── config.json
├── logs/
└── images/                  # 所有图片文件 (all image files)
    ├── image-1234567890.jpg
    ├── photo.png
    └── ...
```

### JSON 格式 (JSON Format)

**旧格式 (Old format)** - base64 in JSON:
```json
{
  "word": "bulldozer",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."  // 很长！
  ]
}
```

**新格式 (New format)** - relative path:
```json
{
  "word": "bulldozer",
  "images": [
    "images/bulldozer.jpg"  // 简洁！
  ]
}
```

## 实现细节 (Implementation Details)

### 1. Electron API 新增功能

**main.ts** - 添加了两个新的 IPC handlers:

- `fs:saveImage` - 保存图片文件到 `images/` 文件夹
  - 输入：projectPath, imageData (base64), fileName (optional)
  - 输出：relativePath (e.g., "images/photo.jpg")

- `fs:getImagePath` - 从相对路径加载图片
  - 输入：projectPath, relativePath
  - 输出：dataUrl (base64 for display)

### 2. 组件修改

**AddWord.tsx** & **EditModal.tsx**:
- `handleImageUpload` 现在会调用 `electronAPI.fs.saveImage`
- 图片保存到 `images/` 文件夹
- JSON 里只存相对路径

**VocabImage.tsx** (新组件):
- 智能加载图片：
  - 如果是 `data:` 开头 → 直接显示 (兼容旧数据)
  - 如果是 `images/` 开头 → 从项目文件夹加载
  - 否则 → 当作 URL 处理

**WordCard.tsx** & **Library.tsx**:
- 使用 `VocabImage` 组件显示图片
- 传递 `projectPath` 参数

### 3. 导出功能增强

**main.ts** - `fs:exportProject`:
- 现在会自动复制 `images/` 文件夹
- 导出的项目包含所有图片文件

## 兼容性 (Compatibility)

✅ **向后兼容** - 旧的 base64 格式仍然可以显示
- VocabImage 组件会检测 `data:` 开头的字符串
- 自动使用旧格式显示

✅ **LaTeX 导入** - 完全兼容
- 转换器已经生成 `images/` 路径格式
- 图片文件已经复制到 `images/` 文件夹

## 使用方法 (Usage)

### 添加图片 (Add Image)

1. 在 Add Word 或 Edit 界面点击 "Add image"
2. 选择图片文件
3. 图片自动保存到 `images/` 文件夹
4. JSON 里存储相对路径

### 查看图片 (View Image)

- 在 Review 或 Library 界面自动加载显示
- 支持 JPG, PNG, GIF 等格式

### 导出项目 (Export Project)

- Settings → Export Project
- 导出的文件夹包含 `images/` 目录
- 所有图片文件都会被复制

## 测试 (Testing)

### 测试新图片上传

1. 打开 Add Word
2. 添加一张图片
3. 检查项目文件夹的 `images/` 目录
4. 确认图片文件存在
5. 检查 `vocabulary.json` 里的路径格式

### 测试旧数据兼容性

1. 导入 `wordlist-imported-vocab-v3` (有图片的项目)
2. 查看有图片的单词 (如 "bulldozer", "derrick")
3. 确认图片正常显示

### 测试导出功能

1. 导出一个有图片的项目
2. 检查导出文件夹的 `images/` 目录
3. 确认所有图片都被复制

## 文件修改列表 (Modified Files)

1. **vocab-review-app/electron/main.ts** - 添加图片保存/加载 API
2. **vocab-review-app/electron/preload.ts** - 暴露新 API
3. **vocab-review-app/src/components/VocabImage.tsx** - 新组件
4. **vocab-review-app/src/components/AddWord.tsx** - 使用新 API
5. **vocab-review-app/src/components/EditModal.tsx** - 使用新 API
6. **vocab-review-app/src/components/WordCard.tsx** - 使用 VocabImage
7. **vocab-review-app/src/components/Library.tsx** - 使用 VocabImage
8. **vocab-review-app/src/App.tsx** - 传递 projectPath

## 优势 (Benefits)

✅ **文件管理更方便** - 图片在独立文件夹，易于查看和管理
✅ **JSON 文件更小** - 不再包含大量 base64 数据
✅ **导出更完整** - 自动包含所有图片文件
✅ **符合标准** - 与 LaTeX 转换器生成的格式一致
✅ **向后兼容** - 旧数据仍然可以正常使用

## 下一步 (Next Steps)

1. 重新编译 Electron: `npm run build:electron`
2. 测试图片上传功能
3. 测试导入 LaTeX 转换的项目
4. 确认图片正常显示

---

**完成时间**: 2026-01-31
**状态**: ✅ 已完成并编译成功
