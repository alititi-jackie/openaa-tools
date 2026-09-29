# OpenAA 工具库 - 一键发布清单

## 🚀 快速发布 (5 分钟)

### 前置条件
- [ ] 本地已克隆仓库: `alititi-jackie/openaa-tools`
- [ ] 已安装 Git
- [ ] 拥有仓库 push 权限

### 第一步: 本地验证 (1 分钟)

```bash
# 切换到项目目录
cd openaa-tools

# 运行自动检查脚本
bash scripts/deploy.sh

# 如果一切通过，你会看到绿色的 ✓ 标记
# 如果有问题，脚本会显示红色的 ✗ 和具体错误信息
```

### 第二步: 合并到 main (2 分钟)

```bash
# 确保当前在 feature 分支
git status

# 切换到 main
git checkout main

# 确保 main 是最新的
git pull origin main

# 合并 feature 分支
git merge feature/openaa-redesign

# 推送到 GitHub
git push origin main
```

### 第三步: GitHub Pages 配置 (2 分钟)

**在浏览器中:**

1. 打开 https://github.com/alititi-jackie/openaa-tools
2. 点击 "Settings" (仓库设置)
3. 左侧菜单选择 "Pages"
4. 在 "Custom domain" 输入框输入: `tools.openaa.com`
5. 点击 "Save"
6. 确保 "Enforce HTTPS" 已勾选 ✓
7. 等待下方显示 "Your site is published at https://tools.openaa.com"

### 第四步: DNS 配置 (1 分钟 + 5-30 分钟等待)

**在你的 DNS 提供商 (如 Cloudflare, Route53 等) 中:**

1. 添加或编辑 CNAME 记录
   - 名称: `tools`
   - 值: `alititi-jackie.github.io`
   - TTL: 3600 (或默认)
2. 保存
3. 等待 DNS 传播 (通常 5-30 分钟)

## ✅ 发布验证 (5-10 分钟后)

### 命令行验证

```bash
# 检查 HTTPS 连接
curl -I https://tools.openaa.com/
# 预期: HTTP/2 200

# 检查首页
curl https://tools.openaa.com/ | grep "OpenAA"
# 预期: 包含 OpenAA 文本

# 检查 robots.txt
curl https://tools.openaa.com/robots.txt
# 预期: 包含 tools.openaa.com

# 检查 sitemap.xml
curl https://tools.openaa.com/sitemap.xml
# 预期: 包含 tools.openaa.com
```

### 浏览器验证

- [ ] 打开 https://tools.openaa.com
- [ ] 验证首页加载正常
- [ ] 验证所有导航链接有效
- [ ] 检查浏览器控制台无错误 (F12)
- [ ] 验证移动端显示正常
- [ ] 点击工具卡片，验证链接有效
- [ ] 在工具导航页测试搜索和筛选
- [ ] 访问 /nonexistent 验证 404 页面

## 🔍 故障排查

### 问题: DNS 仍指向旧站点

```bash
# 检查当前 DNS 记录
nslookup tools.openaa.com

# 如果还是旧 IP，则:
# 1. 检查 DNS 提供商是否正确配置
# 2. 等待 TTL 过期 (通常 24 小时)
# 3. 清除本地 DNS 缓存:
#    - Windows: ipconfig /flushdns
#    - Mac: sudo dscacheutil -flushcache
#    - Linux: sudo systemctl restart systemd-resolved
```

### 问题: HTTPS 证书错误

```bash
# 检查 GitHub Pages 是否生成了证书
# 回到 Settings → Pages，查看 SSL/TLS 状态
# 如果还是有问题，尝试:
# 1. 取消勾选 "Enforce HTTPS"
# 2. 等待 5 分钟
# 3. 重新勾选 "Enforce HTTPS"
```

### 问题: 页面样式加载失败

```bash
# 硬刷新 (Ctrl+Shift+R 或 Cmd+Shift+R)
# 或者用无痕模式打开
# 或者检查浏览器控制台 CSS 文件是否返回 404
```

## 📊 发布后 (1-7 天)

### 第一天

- [ ] 手动验证所有主要功能
- [ ] 检查浏览器控制台错误
- [ ] 验证移动设备兼容性
- [ ] 在 Google Search Console 中提交 sitemap

### 第二周

- [ ] 监控 Google Search Console 索引进度
- [ ] 检查 Google Analytics 数据
- [ ] 收集用户反馈
- [ ] 修复发现的问题

## 📝 命令速查

```bash
# 全部一次执行 (最快)
git checkout main && \
git pull origin main && \
git merge feature/openaa-redesign && \
git push origin main && \
git tag -a v1.0.0-openaa -m "OpenAA 工具库正式版" && \
git push origin v1.0.0-openaa

# 验证发布成功
curl -I https://tools.openaa.com/

# 查看发布说明
cat docs/QUICK_DEPLOY.md
```

## 🎉 完成!

当你看到这些时，发布就成功了:

✅ `curl -I https://tools.openaa.com/` 返回 HTTP/2 200
✅ 浏览器访问 https://tools.openaa.com 显示首页
✅ GitHub Actions 构建状态为绿色
✅ SSL 证书有效
✅ 所有导航和功能正常

---

**需要帮助?**
- 📖 完整手册: docs/HANDBOOK.md
- 📋 检查清单: docs/FINAL_CHECKLIST.md  
- 🚀 快速部署: docs/QUICK_DEPLOY.md
- 🐛 问题报告: https://github.com/alititi-jackie/openaa-tools/issues
