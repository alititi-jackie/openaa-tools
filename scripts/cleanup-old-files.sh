#!/bin/bash
# OpenAA 工具库 - 最终清理脚本
# 使用前: 备份所有重要文件
# 使用: bash scripts/cleanup-old-files.sh

echo "⚠️  警告: 这个脚本会删除旧文件"
echo "确保你已经备份了所有重要文件"
echo ""
read -p "继续吗? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

echo "清理旧品牌文件和缓存..."

# 删除旧的 CSS 文件 (如果存在)
rm -f css/site.css.bak
rm -f css/*.bak

# 删除 Node modules 缓存 (如果存在)
rm -rf node_modules
rm -f package-lock.json

echo "✓ 清理完成"
echo ""
echo "已保留的文件:"
echo "  - 所有 HTML 文件 (已更新为 OpenAA 风格)"
echo "  - src/ 目录 (新的设计系统)"
echo "  - docs/ 目录 (文档和指南)"
echo "  - tools/ 目录 (工具页面)"
echo ""
