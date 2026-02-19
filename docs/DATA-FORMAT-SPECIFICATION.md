# 数据格式规范 (Data Format Specification)

## 概述
本文档定义了词汇复习应用的数据导入导出格式，确保数据在不同版本和实例之间的兼容性。

## 项目文件夹结构

每个词汇项目是一个文件夹，包含以下文件：

```
my-vocabulary-project/
├── vocabulary.json      # 词汇数据（必需）
├── config.json          # 项目配置（必需）
└── logs/                # 日志文件夹（可选）
    └── *.log
```

## vocabulary.json 格式

### 顶层结构
```json
{
  "vocabulary": [...],
  "version": 4,
  "lastModified": "2026-01-31T01:00:00.000Z",
  "userIdCounter": 1000
}
```

### 字段说明

#### `vocabulary` (Array<VocabularyEntry>)
词汇条目数组，每个条目包含：

```typescript
interface VocabularyEntry {
  id: number;                    // 唯一ID，用户添加的词 >= 1000
  word: string;                  // 单词
  ipa?: string;                  // IPA音标（可选）
  respelling?: string;           // 自然拼读（可选，如 "BULK"）
  definitions: Definition[];     // 定义数组
  variants?: string[];           // 变体（可选）
  familiarityScore: number;      // 熟悉度分数 (0-100)
  timesReviewed: number;         // 复习次数
  timesCorrect: number;          // 正确次数
}

interface Definition {
  partOfSpeech: string;          // 词性（如 "noun", "verb"）
  text: string;                  // 定义文本
  examples?: string[];           // 例句（可选）
  subDefinitions?: SubDefinition[]; // 子定义（可选）
}

interface SubDefinition {
  text: string;                  // 子定义文本
  examples?: string[];           // 例句（可选）
}
```

#### `version` (number)
数据格式版本号，当前版本：**4**

版本历史：
- v1: 初始版本
- v2: 添加了variants字段
- v3: 添加了subDefinitions
- v4: 添加了respelling字段

#### `lastModified` (string)
最后修改时间，ISO 8601格式

#### `userIdCounter` (number)
用户添加词汇的ID计数器，起始值1000
- ID 1-999: 保留给mockData
- ID >= 1000: 用户添加的词

## config.json 格式

```json
{
  "projectName": "My Vocabulary",
  "createdAt": "2026-01-31T01:00:00.000Z",
  "lastOpened": "2026-01-31T01:00:00.000Z"
}
```

### 字段说明

- `projectName`: 项目名称
- `createdAt`: 创建时间（ISO 8601）
- `lastOpened`: 最后打开时间（ISO 8601）

## 导出格式

### 完整项目导出
导出整个项目文件夹，包含：
- vocabulary.json
- config.json
- logs/ 目录（如果存在）

### JSON导出（浏览器模式）
仅导出vocabulary.json的内容

## 导入格式

### 项目文件夹导入
选择包含vocabulary.json的文件夹

**验证规则：**
1. 文件夹必须包含vocabulary.json
2. vocabulary.json必须是有效的JSON
3. 必须包含`vocabulary`数组和`version`字段

### JSON导入（浏览器模式）
选择.json文件

**验证规则：**
1. 必须是有效的JSON
2. 必须包含`vocabulary`数组

## 版本兼容性

### 向后兼容
新版本应该能够读取旧版本的数据：
- 缺失的字段使用默认值
- 忽略未知字段

### 版本升级
当检测到旧版本数据时：
1. 读取现有数据
2. 添加新字段的默认值
3. 更新version字段
4. 保存更新后的数据

### 示例：v3 → v4 升级
```typescript
if (data.version < 4) {
  // 为每个词条添加respelling字段（默认为undefined）
  data.vocabulary.forEach(entry => {
    if (!entry.respelling) {
      entry.respelling = undefined;
    }
  });
  data.version = 4;
}
```

## Mock Data 管理

### Mock Data ID范围
- ID 1-999: 保留给mockData
- 当mockData更新时，新词会自动合并到用户数据中

### Mock Data版本
在`src/data/mockData.ts`中定义：
```typescript
export const MOCK_DATA_VERSION = 4;
```

### 合并逻辑
```typescript
if (data.version < MOCK_DATA_VERSION) {
  const userWordIds = new Set(vocabulary.map(w => w.id));
  const newMockWords = mockVocabulary.filter(w => !userWordIds.has(w.id));
  vocabulary = [...newMockWords, ...vocabulary];
}
```

## 数据完整性

### 必需字段
- `id`: 必须唯一
- `word`: 不能为空
- `definitions`: 至少包含一个定义
- `familiarityScore`: 0-100
- `timesReviewed`: >= 0
- `timesCorrect`: >= 0

### 数据验证
导入时应验证：
1. JSON格式正确
2. 必需字段存在
3. 数据类型正确
4. ID唯一性
5. 数值范围合法

## 最佳实践

### 导出
1. 定期导出备份
2. 导出前确保数据已保存
3. 导出文件夹包含完整项目结构

### 导入
1. 导入前备份当前数据
2. 验证导入文件格式
3. 导入后检查数据完整性

### 版本控制
1. 每次格式变更增加版本号
2. 保持向后兼容
3. 记录版本变更历史

## 故障排除

### 导入后数据为空
**可能原因：**
1. vocabulary.json格式错误
2. 文件路径不正确
3. 权限问题

**解决方案：**
1. 检查JSON格式是否有效
2. 确认文件夹包含vocabulary.json
3. 检查文件读取权限

### 数据丢失
**可能原因：**
1. 版本不兼容
2. 数据覆盖

**解决方案：**
1. 从备份恢复
2. 检查版本兼容性
3. 使用数据恢复工具

## 未来扩展

### 计划中的字段
- `tags`: 标签系统
- `notes`: 笔记
- `audioUrl`: 音频链接
- `imageUrl`: 图片链接

### 计划中的功能
- 增量导出（仅导出变更）
- 云同步
- 多设备同步
- 冲突解决

## 更新日志

### v4 (2026-01-31)
- 添加`respelling`字段用于自然发音
- 更新数据格式文档

### v3 (之前)
- 添加`subDefinitions`支持
- 添加`variants`字段

### v2 (之前)
- 初始版本

---

**重要提示：** 任何对数据格式的修改都必须更新此文档，并增加版本号！
