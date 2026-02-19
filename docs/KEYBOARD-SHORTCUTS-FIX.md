# 键盘快捷键冲突修复

## 修复的问题

### 1. Modal 打开时按键触发后面的评分
**问题**: 打开 Edit/Add Modal 时，按回车或数字键会触发 WordCard 的评分功能

**原因**: WordCard 的键盘监听器在全局 window 上，Modal 打开时仍然在工作

**修复**: 
- WordCard 现在检查焦点是否在输入框或 Modal 中
- 如果是，则不处理键盘事件
- EditModal 使用 capture phase 拦截 Escape 键

### 2. 不能输入 'k' 字母
**问题**: 在 Edit/Add 模式的输入框中无法输入字母 'k'

**原因**: WordCard 的 vim 快捷键 'k'（向上选择）占用了这个键

**修复**: 
- WordCard 检查事件目标是否是 INPUT/TEXTAREA
- 如果是输入框，则不处理 'k' 键
- 让输入框正常接收所有字符

### 3. 编辑后显示没更新
**问题**: 编辑单词后，WordCard 显示的还是旧单词

**原因**: React 的 HMR (Hot Module Reload) 不会自动刷新 props

**解决方案**: 
- 编辑后保存会触发 `handleSaveEdit`
- 这会调用 `dataStore.updateWord` 和 `dataStore.getVocabulary`
- 更新后的数据会通过 props 传递给 WordCard
- 如果还是没更新，刷新页面（Cmd+R）

## 修改的文件

1. **WordCard.tsx**
   - 添加输入框和 Modal 检测
   - 只在非输入状态下处理快捷键

2. **EditModal.tsx**
   - 使用 capture phase 拦截 Escape
   - 阻止事件冒泡到 WordCard

## 测试步骤

1. **测试 Modal 键盘隔离**:
   - 打开 Edit Modal
   - 按 1-5 数字键 → 应该输入数字，不触发评分
   - 按回车 → 应该换行或提交表单，不触发评分
   - 按 Escape → 应该关闭 Modal

2. **测试 'k' 字母输入**:
   - 打开 Edit Modal
   - 在任何输入框中输入 'k' → 应该正常输入
   - 在 Word 输入框输入 "book" → 应该正常显示

3. **测试快捷键仍然工作**:
   - 关闭所有 Modal
   - 按 'k' → 应该向上选择评分
   - 按 'j' → 应该向下选择评分
   - 按 1-5 → 应该直接评分

## 键盘快捷键参考

### Review 模式（无 Modal）
- `1-5`: 直接评分
- `k` / `↑`: 向上选择评分
- `j` / `↓`: 向下选择评分
- `Enter`: 确认选择的评分
- `Space` / `Tab`: 显示定义
- `e`: 编辑当前单词
- `Backspace`: 返回上一个单词
- `Escape`: 结束会话
- `w` / `s`: 滚动单词卡片

### Edit/Add Modal 打开时
- `Escape`: 关闭 Modal
- 所有其他按键: 正常输入
- `Cmd/Ctrl + B`: 加粗文本
- `Cmd/Ctrl + K`: 插入链接

## 注意事项

- HMR 可能不会立即更新所有状态
- 如果编辑后显示异常，刷新页面（Cmd+R）
- 键盘快捷键只在 Review 视图有效
- Library 和 Add 视图不受影响
