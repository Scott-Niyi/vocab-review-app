# File Logging System - Test Guide

## 概述

文件日志系统现在已经集成到应用中。日志会同时输出到：
1. **浏览器控制台**（ConsoleLogger）
2. **项目文件夹的 logs/ 目录**（FileLogger）

## 测试步骤

### 1. 检查日志文件夹

打开你的项目文件夹（例如 `wordlist-imported-vocab-v3`），你应该看到一个 `logs/` 文件夹。

```
wordlist-imported-vocab-v3/
├── config.json
├── vocabulary.json
├── images/
└── logs/              ← 新创建的日志文件夹
    └── 2026-02-04.log ← 今天的日志文件
```

### 2. 查看日志文件内容

打开日志文件（例如 `2026-02-04.log`），你应该看到类似这样的内容：

```json
{"timestamp":"2026-02-04T15:30:45.123Z","actionType":"project_opened","properties":{"projectPath":"wordlist-imported-vocab-v3"}}
{"timestamp":"2026-02-04T15:30:45.456Z","actionType":"review_queue_generated","properties":{"wordCount":20,"selectionCriteria":"spaced_repetition_algorithm"}}
{"timestamp":"2026-02-04T15:31:12.789Z","actionType":"word_reviewed","properties":{"wordId":1,"wordText":"ephemeral","rating":4,"familiarityBefore":50,"familiarityAfter":65}}
```

每一行都是一个完整的 JSON 对象，包含：
- `timestamp`: ISO 8601 格式的时间戳
- `actionType`: 操作类型
- `properties`: 操作相关的数据

### 3. 测试各种操作

执行以下操作并检查日志文件：

#### a) 项目打开
- 打开应用，选择一个项目
- 日志应该包含 `project_opened` 事件

#### b) 单词复习
- 在 Review 页面给单词评分
- 日志应该包含 `word_reviewed` 事件，包含评分和熟悉度变化

#### c) 搜索
- 在 Library 页面搜索单词
- 日志应该包含 `search_performed` 事件（500ms 防抖后）

#### d) 添加单词
- 在 Add Word 页面添加新单词
- 日志应该包含 `word_added` 事件，包含所有单词字段

#### e) 编辑单词
- 在 Library 中编辑单词
- 日志应该包含 `word_edited` 事件，包含变更详情

#### f) 删除单词
- 在 Library 中删除单词
- 日志应该包含 `word_deleted` 事件

#### g) 导入/导出
- 在 Settings 中导入或导出数据
- 日志应该包含 `data_imported` 或 `data_exported` 事件

### 4. 日志文件特性

#### 日期命名
- 日志文件按日期命名：`YYYY-MM-DD.log`
- 每天的日志会写入对应日期的文件
- 跨天时会自动创建新文件

#### 单行 JSON 格式
- 每个日志条目占一行
- 使用标准 JSON 格式，便于解析
- 可以使用 `jq` 等工具分析日志

#### 追加写入
- 日志会追加到文件末尾
- 不会覆盖已有日志
- 支持并发写入（通过队列管理）

#### 错误处理
- 如果文件写入失败，会重试 3 次（指数退避）
- 如果所有重试都失败，日志会输出到控制台
- 应用不会因为日志写入失败而崩溃

### 5. 日志分析示例

#### 使用 jq 查看所有单词复习记录
```bash
cat logs/2026-02-04.log | jq 'select(.actionType == "word_reviewed")'
```

#### 统计今天复习了多少单词
```bash
cat logs/2026-02-04.log | jq 'select(.actionType == "word_reviewed")' | wc -l
```

#### 查看所有搜索查询
```bash
cat logs/2026-02-04.log | jq 'select(.actionType == "search_performed") | .properties.query'
```

#### 查看所有错误
```bash
cat logs/2026-02-04.log | jq 'select(.level == "error")'
```

## 故障排除

### 日志文件夹没有创建
- 确保你在 Electron 环境中运行（不是浏览器）
- 检查项目文件夹是否有写入权限
- 查看控制台是否有错误信息

### 日志没有写入文件
- 检查控制台是否有 `[LogEntryQueue]` 或 `[FileLogger]` 的错误信息
- 确保 electronAPI 可用
- 尝试重启应用

### 日志格式不正确
- 每行应该是完整的 JSON 对象
- 如果看到多行 JSON，可能是格式化器有问题
- 报告 bug 并提供日志样本

## 性能考虑

- 日志写入是异步的，不会阻塞 UI
- 使用队列管理，避免并发写入冲突
- 队列最大容量 1000 条，超出会丢弃最旧的日志
- 重试机制使用指数退避（100ms, 200ms, 400ms）

## 隐私和安全

- 日志文件存储在本地项目文件夹
- 不会上传到任何服务器
- 包含用户操作数据（单词、评分等）
- 如果分享项目文件夹，记得检查日志内容

## 下一步

- 可以添加日志轮转（自动删除旧日志）
- 可以添加日志压缩（节省空间）
- 可以添加日志查看器 UI
- 可以添加日志导出功能
