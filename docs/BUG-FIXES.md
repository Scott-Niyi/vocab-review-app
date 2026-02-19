# Bug Fixes - February 5, 2026

## Bug 1: Hyperlink跳转到新添加单词失败
**问题**: Link到新添加的单词（ID >= 1000）时跳转错误
**原因**: `vocabulary`数组可能没有及时更新，或者WordCard的`vocabulary` prop没有传递最新数据
**修复**: 确保WordCard接收最新的vocabulary数组

## Bug 2: 删除image后出现重复词条
**问题**: 在EditModal中删除image后，保存时出现两个词条
**原因**: 可能是React状态更新问题或者保存逻辑有bug
**修复**: 检查EditModal的handleSave逻辑

## Bug 3: Library评分系统问题
**问题**: 
- Review次数不变（实际上会变，用户可能没注意到）
- Familiarity计算不合理（Barely=2分给-8分，导致3%）

**修复**: 
- 调整评分系统，让Barely (2分) 给予小幅正向提升（+5分）
- 调整其他评分的权重，让进步更明显

### 新的评分系统：
- 1 (Don't know): -20分
- 2 (Barely): +5分 （改为正值）
- 3 (Familiar): +15分
- 4 (Know well): +25分
- 5 (Master): +35分

## 测试步骤：
1. 添加新单词，测试hyperlink跳转
2. 编辑单词，删除image，保存，检查是否重复
3. 在Library中评分，检查familiarity和timesReviewed的变化
