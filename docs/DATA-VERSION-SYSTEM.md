# 数据版本管理系统

## 工作原理

### 自动合并机制

应用现在会自动检测 mockData 更新并智能合并数据：

1. **版本号检查**：每次启动时检查 `MOCK_DATA_VERSION`
2. **智能合并**：
   - mockData 单词（ID ≤ 1000）：总是使用最新版本
   - 用户添加的单词（ID > 1000）：保留不变
3. **无需手动清除**：版本更新时自动刷新 mockData

### ID 分配规则

- **ID 1-1000**: 保留给 mockData（示例单词）
- **ID 1001+**: 用户添加的单词

### 版本更新流程

当开发者更新 mockData 时：

1. 修改 `src/data/mockData.ts` 中的单词
2. 增加 `MOCK_DATA_VERSION` 版本号
3. 用户刷新页面时自动获取更新

## 示例

### 当前版本：3

**包含的 mockData 单词**：
1. bulk（带子短语 "in bulk", "bulk up"）
2. tackle
3. fit（带超链接）
4. drench
5. spasm（带超链接）
6. intra-beltway（带变体 "inside-the-beltway"）
7. fraught with（每个定义有专属例句）

### 用户添加的单词

用户通过 "Add Word" 添加的单词会获得 ID > 1000，例如：
- ID 1001: test
- ID 1002: example
- ...

这些单词在 mockData 更新时**不会被覆盖**。

## 开发者指南

### 更新 mockData

```typescript
// 1. 修改 mockData
export const mockVocabulary: VocabularyEntry[] = [
  // ... 添加或修改单词
];

// 2. 增加版本号
export const MOCK_DATA_VERSION = 4;  // 从 3 改为 4
```

### 测试版本更新

1. 添加一个用户单词（ID 会是 1001+）
2. 修改 mockData 并增加版本号
3. 刷新页面
4. 验证：
   - mockData 单词已更新
   - 用户单词仍然存在

## 控制台日志

应用会在控制台显示数据加载信息：

```
🔄 Loading fresh mockData (version: 3)
```
或
```
✅ Merged data: 7 mock + 2 user words
```

## 手动重置（如果需要）

如果需要完全重置到 mockData：

```javascript
localStorage.clear();
location.reload();
```

## 未来改进

- [ ] 添加数据导出功能
- [ ] 添加数据导入功能
- [ ] 迁移到 SQLite 数据库
- [ ] 支持云同步
