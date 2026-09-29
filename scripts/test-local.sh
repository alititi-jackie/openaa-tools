#!/bin/bash
# OpenAA 工具库 - 快速本地测试脚本
# 使用: bash scripts/test-local.sh

echo "================================"
echo "OpenAA 工具库 本地测试脚本"
echo "================================"
echo ""

# 检查依赖
echo "检查环境..."
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ 需要安装 Python"
    exit 1
fi

echo "✓ Python 已安装"
echo ""

# 启动本地服务器
echo "启动本地开发服务器..."
echo "访问: http://localhost:8080"
echo "停止服务: 按 Ctrl+C"
echo ""

if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
else
    python -m SimpleHTTPServer 8000
fi
