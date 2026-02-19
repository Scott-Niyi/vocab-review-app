# 导入导出功能修复

## 问题描述
用户报告：导出项目后再导入，显示一片空白。

## 根本原因分析

### 问题1：启动逻辑冲突
之前修复启动行为时，移除了FileSystemStore从localStorage自动加载项目路径的逻辑。但是导入功能依赖于这个逻辑：

```typescript
// 旧的导入流程：
1. 用户选择项目文件夹
2. 设置 localStorage.setItem('vocab_project_path', path)
3. window.location.reload()
4. ❌ FileSystemStore构造函数不再读取localStorage
5. ❌ projectPath为空，显示VocabularySelector
6. ❌ 用户看到空白界面
```

### 问题2：状态管理不一致
导入后通过reload更新状态，但是：
- localStorage有值
- FileSystemStore的projectPath为空
- App的selectedProjectPath为null
- 导致状态不一致

## 解决方案

### 1. 修改App.tsx
添加`onProjectSwitch`回调，允许Settings组件直接更新项目路径：

```typescript
<Settings 
  onClose={() => setShowSettings(false)}
  onProjectSwitch={(newProjectPath) => {
    setSelectedProjectPath(newProjectPath);
    setShowSettings(false);
  }}
/>
```

### 2. 修改Settings.tsx
导入项目时，直接调用`onProjectSwitch`而不是reload：

```typescript
const handleImportProject = async () => {
  const result = await electronAPI.fs.selectProjectFolder();
  
  if (result.success && result.projectPath) {
    // 直接切换项目，不需要reload
    if (onProjectSwitch) {
      onProjectSwitch(result.projectPath);
      alert('Project imported successfully!');
    }
  }
};
```

### 3. 修改App.tsx的useEffect
确保projectPath变化时重新加载数据：

```typescript
useEffect(() => {
  if (!selectedProjectPath) {
    setLoading(false);
    return;
  }

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      await dataStore.setProjectPath(selectedProjectPath);
      const vocab = await dataStore.getVocabulary();
      setVocabulary(vocab);
    } finally {
      setLoading(false);
    }
  };

  loadVocabulary();
}, [selectedProjectPath]); // 依赖selectedProjectPath
```

## 测试步骤

### 测试1：导出项目
1. 打开一个有数据的项目
2. 点击Settings → Export Project
3. 选择导出位置
4. ✅ 验证导出文件夹包含：
   - vocabulary.json
   - config.json
   - logs/ 目录

### 测试2：导入项目
1. 点击Settings → Import Project
2. 选择之前导出的项目文件夹
3. ✅ 应该立即加载项目数据
4. ✅ 不应该显示空白界面
5. ✅ 词汇列表应该显示正确的数据

### 测试3：切换项目
1. 点击Settings → Switch Project
2. ✅ 应该返回到VocabularySelector
3. 选择另一个项目
4. ✅ 应该加载新项目的数据

## 数据格式文档

创建了`DATA-FORMAT-SPECIFICATION.md`文档，记录：
- 项目文件夹结构
- vocabulary.json格式
- config.json格式
- 版本兼容性规则
- 导入导出规范

**重要：** 以后任何数据格式变更都必须更新此文档！

## 文件修改清单

- ✅ `vocab-review-app/src/App.tsx`
  - 添加onProjectSwitch回调
  - 修改useEffect处理空projectPath
  
- ✅ `vocab-review-app/src/components/Settings.tsx`
  - 添加onProjectSwitch prop
  - 修改handleImportProject使用回调
  - 修改handleSwitchProject使用回调

- ✅ `vocab-review-app/DATA-FORMAT-SPECIFICATION.md`
  - 新建数据格式规范文档

## 后续改进建议

### 1. 添加导入验证
```typescript
async function validateProjectFolder(path: string): Promise<boolean> {
  // 检查vocabulary.json是否存在
  // 检查JSON格式是否有效
  // 检查必需字段是否存在
  return true;
}
```

### 2. 添加导入预览
导入前显示项目信息：
- 项目名称
- 词汇数量
- 创建时间
- 最后修改时间

### 3. 添加导入选项
- 合并到当前项目
- 替换当前项目
- 创建新项目

### 4. 添加错误处理
- 文件不存在
- 格式错误
- 权限问题
- 版本不兼容

## 已知限制

1. **浏览器模式**：只能导入导出JSON文件，不支持完整项目文件夹
2. **版本兼容**：只支持v1-v4格式，更老的格式可能无法导入
3. **大文件**：非常大的项目（>10000词）可能导入较慢

## 测试结果

- ✅ TypeScript编译通过
- ✅ Vite构建成功
- ⏳ 需要用户测试实际导入导出功能

## 下一步

1. 用户测试导入导出功能
2. 如果还有问题，添加详细的错误日志
3. 考虑添加导入预览功能
