# 间隔重复算法实现完成

## 实现概述

已成功实现智能间隔重复算法，替换了原有的顺序选词逻辑。

## 核心改进

### 1. 加权随机选词
- **之前**: 按熟悉度排序，确定性选择
- **现在**: 加权随机抽样，不熟悉的单词出现概率更高
- 熟悉度是首要因素（指数衰减）
- 复习次数是次要因素（从未复习的单词获得 2x 加成）

### 2. 科学的熟悉度更新
- **之前**: 简单线性调整 `(rating - 3) * 10`
- **现在**: 
  - 评分 1-2: 大幅降低（-15, -8）
  - 评分 3: 小幅提高（+3）
  - 评分 4-5: 显著提高（+10, +15）
  - 递减学习率：高分时更难提高
  - 遗忘惩罚：高分低评分时降低更多

### 3. 复习队列机制
- 会话开始时加载 20 个单词的复习队列
- 队列结束时自动重新加载新队列
- 保持现有的导航历史和 Backspace 返回功能

## 测试覆盖

### 单元测试 (29 个测试)
- `calculateSelectionWeight`: 边界条件和输入验证
- `updateFamiliarityScore`: 评分效果和边界条件
- `selectWordsForReview`: 边界情况和无重复选择

### 属性测试 (10 个测试，每个 100 次迭代)
1. 权重单调性
2. 复习次数加成
3. 熟悉度主导性
4. 分数边界不变量
5. 评分效果单调性
6. 学习率递减
7. 遗忘惩罚
8. 选择数量正确性
9. 选择唯一性
10. 加权随机抽样正确性

**所有测试通过率: 100% (39/39)**

## 文件修改

### 新增文件
- `src/utils/spacedRepetition.ts` - 核心算法实现
- `src/utils/__tests__/spacedRepetition.test.ts` - 单元测试
- `src/utils/__tests__/spacedRepetition.property.test.ts` - 属性测试
- `vitest.algorithm.config.ts` - 算法测试配置

### 修改文件
- `src/services/LocalStorageStore.ts` - 使用新算法
- `src/services/FileSystemStore.ts` - 使用新算法
- `src/App.tsx` - 集成复习队列机制

## 使用方法

### 启动应用
```bash
cd vocab-review-app
npm run dev
```

### 运行测试
```bash
# 运行所有算法测试
npx vitest --config=vitest.algorithm.config.ts --run

# 只运行单元测试
npx vitest --config=vitest.algorithm.config.ts spacedRepetition.test.ts --run

# 只运行属性测试
npx vitest --config=vitest.algorithm.config.ts spacedRepetition.property.test.ts --run
```

### 构建 Electron 应用
```bash
npm run build:electron
npm run electron:dev
```

## 算法参数

可以在 `src/utils/spacedRepetition.ts` 中调整以下参数：

- `minWeight`: 最小权重 (默认 0.1)
- `maxWeight`: 最大权重 (默认 10.0)
- `k`: 指数衰减常数 (默认 0.05)
- `ratingEffects`: 评分对应的分数变化
- 学习率公式

## 向后兼容性

- ✅ 保持现有的 VocabularyEntry 接口
- ✅ 保持现有的导航历史功能
- ✅ 保持 Backspace 返回功能
- ✅ 保持超链接导航功能
- ✅ 不需要数据迁移

## 下一步

应用已准备好使用。建议：
1. 启动应用测试复习功能
2. 验证不熟悉的单词出现更频繁
3. 验证评分后熟悉度分数正确更新
4. 验证 Backspace 返回功能正常

如有问题，请查看测试文件了解算法行为。
