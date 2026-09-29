#!/bin/bash
# OpenAA 工具库 - 最终发布执行脚本
# 使用: bash scripts/deploy.sh

set -e  # 任何错误都会停止执行

echo "================================"
echo "OpenAA 工具库 发布执行脚本 v1.0.0"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 检查 Git 状态
echo -e "${YELLOW}[1/7] 检查 Git 状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}✗ 工作目录有未提交的更改，请先提交或清理${NC}"
  echo "运行: git status"
  exit 1
fi
echo -e "${GREEN}✓ Git 状态清洁${NC}"
echo ""

# 步骤 2: 验证关键文件
echo -e "${YELLOW}[2/7] 验证关键文件...${NC}"
FILES_TO_CHECK=(
  "index.html"
  "404.html"
  "tools/index.html"
  "robots.txt"
  "sitemap.xml"
  "src/styles/brand.css"
  "src/js/app.js"
  "src/js/tools-registry.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ 缺少文件: $file${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ 所有关键文件存在${NC}"
echo ""

# 步骤 3: 检查旧品牌痕迹
echo -e "${YELLOW}[3/7] 检查旧品牌痕迹...${NC}"
if grep -r "ToolKu" . --include="*.html" --exclude-dir=node_modules 2>/dev/null || true | grep -q .; then
  echo -e "${RED}✗ 仍存在 'ToolKu' 文本${NC}"
  exit 1
fi
if grep -r "toolku\.com" . --include="*.html" --include="*.xml" --exclude-dir=node_modules 2>/dev/null || true | grep -q .; then
  echo -e "${RED}✗ 仍存在 'toolku.com' URL${NC}"
  exit 1
fi
echo -e "${GREEN}✓ 无旧品牌痕迹${NC}"
echo ""

# 步骤 4: 验证新域名
echo -e "${YELLOW}[4/7] 验证新域名配置...${NC}"
if ! grep -q "tools.openaa.com" robots.txt; then
  echo -e "${RED}✗ robots.txt 中没有 tools.openaa.com${NC}"
  exit 1
fi
if ! grep -q "tools.openaa.com" sitemap.xml; then
  echo -e "${RED}✗ sitemap.xml 中没有 tools.openaa.com${NC}"
  exit 1
fi
echo -e "${GREEN}✓ 域名配置正确${NC}"
echo ""

# 步骤 5: 检查 OpenAA 品牌标识
echo -e "${YELLOW}[5/7] 检查 OpenAA 品牌标识...${NC}"
if ! grep -q "OpenAA" index.html; then
  echo -e "${RED}✗ 首页中没有 OpenAA 标识${NC}"
  exit 1
fi
if ! grep -q "0066FF" src/styles/brand.css; then
  echo -e "${RED}✗ 品牌颜色系统不正确${NC}"
  exit 1
fi
echo -e "${GREEN}✓ OpenAA 品牌标识完整${NC}"
echo ""

# 步骤 6: 创建 Git 标签
echo -e "${YELLOW}[6/7] 创建发布标签...${NC}"
TAG="v1.0.0-openaa"
if git rev-parse $TAG >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠ 标签 $TAG 已存在，跳过创建${NC}"
else
  git tag -a $TAG -m "OpenAA 工具库正式版 v1.0.0" -m "完整的品牌重构和功能改造"
  echo -e "${GREEN}✓ 已创建标签: $TAG${NC}"
fi
echo ""

# 步骤 7: 显示发布说明
echo -e "${YELLOW}[7/7] 发布准备完成${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 所有检查通过，可以开始发布!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "接下来的步骤:"
echo ""
echo "1. 合并到 main 分支:"
echo -e "   ${YELLOW}git checkout main${NC}"
echo -e "   ${YELLOW}git merge feature/openaa-redesign${NC}"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo "2. 推送标签:"
echo -e "   ${YELLOW}git push origin $TAG${NC}"
echo ""
echo "3. 在 GitHub 上:"
echo "   - 进入 Settings → Pages"
echo "   - 在 'Custom domain' 输入 tools.openaa.com"
echo "   - 点击 Save"
echo "   - 确保 'Enforce HTTPS' 已勾选"
echo ""
echo "4. 在 DNS 提供商:"
echo "   - 添加 CNAME 记录: tools → alititi-jackie.github.io"
echo "   - 等待 DNS 生效 (5-30 分钟)"
echo ""
echo "5. 发布后验证 (5-10 分钟后):"
echo -e "   ${YELLOW}curl -I https://tools.openaa.com/${NC}"
echo -e "   ${YELLOW}curl https://tools.openaa.com/robots.txt${NC}"
echo ""
echo "📚 查看完整发布指南: docs/QUICK_DEPLOY.md"
echo "📋 最终检查清单: docs/FINAL_CHECKLIST.md"
echo ""
