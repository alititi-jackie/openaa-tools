# OpenAA 工具库 - 快速发布指南

## 📋 发布前最后检查（5 分钟）

### 1. 验证域名配置

```bash
# 检查是否指向 tools.openaa.com
grep -r "tools.openaa.com" .
grep -r "toolku" .  # 不应该有任何结果
```

### 2. 快速功能测试

- [ ] 打开 http://localhost:8080
- [ ] 点击首页的热门工具卡片 ✓
- [ ] 进入 /tools/ 搜索一个工具 ✓
- [ ] 用分类筛选工具 ✓
- [ ] 访问 /nonexistent 看 404 页 ✓
- [ ] 检查页脚链接都有效 ✓

### 3. 浏览器控制台

- [ ] 打开开发者工具 (F12)
- [ ] 检查 Console 选项卡，没有红色错误
- [ ] 检查 Network 选项卡，所有资源都加载成功（绿色）

## 🚀 发布到 GitHub Pages

### 方式一：自动发布（推荐）

```bash
# 1. 提交所有更改
git add .
git commit -m "chore: 最终发布前检查 - OpenAA 工具库 v1.0.0"

# 2. 推送到 main 分支
git push origin main

# 3. GitHub Actions 自动构建和部署
# 等待 workflow 完成（通常 2-3 分钟）
```

### 方式二：手动发布

```bash
# 1. 切换到 main 分支
git checkout main

# 2. 合并 feature 分支
git merge feature/openaa-redesign

# 3. 推送
git push origin main

# 4. 在 GitHub 上等待部署完成
```

## 🔧 配置自定义域名

### 在 GitHub 仓库中：

1. 进入 Settings → Pages
2. 在 "Custom domain" 输入 `tools.openaa.com`
3. 点击 Save
4. 确保 "Enforce HTTPS" 已勾选

### 在 DNS 提供商中：

1. 添加 CNAME 记录
   - 名称: `tools`
   - 值: `alititi-jackie.github.io`
2. 等待 DNS 生效（通常 5-30 分钟）

## ✅ 发布后验证

### 立即检查（发布后 5 分钟）

```bash
# 检查网站是否可访问
curl -I https://tools.openaa.com/

# 检查 robots.txt
curl https://tools.openaa.com/robots.txt

# 检查 sitemap.xml
curl https://tools.openaa.com/sitemap.xml
```

### 完整验证（发布后 30 分钟）

- [ ] 访问 https://tools.openaa.com/
- [ ] 检查首页加载正常
- [ ] 检查所有导航链接有效
- [ ] 检查移动设备显示正常
- [ ] 检查浏览器控制台无错误
- [ ] 检查页面显示 OpenAA 品牌
- [ ] 检查 404 页面风格正确
- [ ] 在 Google Search Console 中提交 sitemap

### 长期监控（发布后 1-7 天）

- [ ] Google Search Console 中检查索引状态
- [ ] 监控 Google Analytics 流量
- [ ] 检查错误日志
- [ ] 收集用户反馈

## 🆘 遇到问题怎么办？

### 问题：域名还是指向旧网站

```bash
# 清空浏览器缓存并重新加载
# 或者使用无痕窗口访问
# 或者在地址栏直接输入 IP: 185.199.108.153
```

### 问题：HTTPS 证书错误

- 在 GitHub Pages 设置中检查 "Enforce HTTPS" 是否勾选
- 等待 5-10 分钟后重试
- 如果仍有问题，禁用再启用一次

### 问题：页面样式加载失败

- 硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
- 检查浏览器控制台中 CSS 文件是否返回 404
- 确保 GitHub Pages 设置中 Branch 选择了 main

### 问题：搜索或分类功能不工作

- 检查 `src/js/tools-registry.js` 是否存在
- 检查 `src/js/app.js` 是否加载成功
- 在浏览器控制台检查 JavaScript 错误

## 📞 需要帮助？

- GitHub Issues：https://github.com/alititi-jackie/openaa-tools/issues
- 邮件：contact@openaa.com
- 官网：https://www.openaa.com

---

**祝贺！** 🎉 OpenAA 工具库已成功上线！
