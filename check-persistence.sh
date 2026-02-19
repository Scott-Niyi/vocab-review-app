#!/bin/bash

DATA_DIR=~/Library/Application\ Support/Electron/user-data

echo "🔍 检查数据文件..."
echo ""

if [ ! -d "$DATA_DIR" ]; then
    echo "❌ 数据目录不存在: $DATA_DIR"
    echo "   请先运行应用: npm run dev"
    exit 1
fi

echo "✅ 数据目录存在: $DATA_DIR"
echo ""

JSON_FILES=$(find "$DATA_DIR" -name "*.json" 2>/dev/null)

if [ -z "$JSON_FILES" ]; then
    echo "⚠️  没有找到 JSON 文件"
    echo "   请先在应用中添加一个单词"
    exit 0
fi

echo "📁 找到的数据文件："
echo "$JSON_FILES"
echo ""

for file in $JSON_FILES; do
    echo "📄 文件: $(basename "$file")"
    
    # 检查是否是有效的 JSON
    if command -v jq &> /dev/null; then
        if jq empty "$file" 2>/dev/null; then
            echo "   ✅ 有效的 JSON 格式"
            
            # 获取单词数量
            word_count=$(jq '.vocabulary | length' "$file")
            echo "   📚 单词数量: $word_count"
            
            # 获取最后修改时间
            last_modified=$(jq -r '.lastModified' "$file")
            echo "   🕐 最后修改: $last_modified"
            
            # 获取版本
            version=$(jq -r '.version' "$file")
            echo "   📌 版本: $version"
            
            # 获取用户ID计数器
            counter=$(jq -r '.userIdCounter' "$file")
            echo "   🔢 用户ID计数器: $counter"
        else
            echo "   ❌ 无效的 JSON 格式！"
        fi
    else
        echo "   ℹ️  安装 jq 来查看详细信息: brew install jq"
        echo "   ✅ 文件存在"
    fi
    echo ""
done

echo "✅ 验证完成！"
echo ""
echo "💡 提示："
echo "   - 添加单词后，文件会立即更新"
echo "   - 查看文件内容: cat \"$DATA_DIR/vocabulary.json\""
echo "   - 实时监控: watch -n 1 \"cat '$DATA_DIR/vocabulary.json' | jq .lastModified\""
