# OpenAA 工具库项目手册

## 快速开始

### 本地预览

```bash
# 使用 Python 3 的 HTTP 服务器
python3 -m http.server 8080

# 或使用 Python 2
python -m SimpleHTTPServer 8000

# 或使用 Node.js 的 http-server
npx http-server
```

然后访问 http://localhost:8080

### 项目结构

```
openaa-tools/
├── src/
│   ├── styles/
│   │   ├── brand.css          # OpenAA 品牌设计系统
│   │   ├── layout.css         # 公共布局和导航
│   │   └── tool-page.css      # 工具页面样式
│   └── js/
│       ├── app.js             # 主应用程序和导航交互
│       ├── tool-page.js       # 工具页面功能
│       └── tools-registry.js  # 工具库配置
├── config/
│   └── site.config.js         # 网站全局配置
├── docs/
│   ├── RELEASE_NOTES.md       # 发布说明
│   ├── FINAL_CHECKLIST.md     # 发布前检查表
│   ├── openaa-redesign-checklist.md  # 改造验收清单
│   └── tool-page-template.html       # 工具页面模板
├── tools/
│   ├── index.html             # 工具导航页
│   └── [tool-name]/
│       └── index.html         # 工具详情页
├── index.html                 # 首页
├── 404.html                   # 404 错误页
├── robots.txt                 # 搜索引擎爬虫配置
├── sitemap.xml                # 网站地图
├── site.webmanifest           # PWA 应用清单
└── README.md                  # 项目说明
```

## 设计系统

### 颜色系统

| 用途 | 颜色 | 十六进制 |
|------|------|----------|
| 主色 | 深蓝 | #0066FF |
| 辅色 | 青蓝 | #00D9FF |
| 强调 | 橙红 | #FF6B35 |
| 成功 | 绿色 | #00D084 |
| 警告 | 橙色 | #FFA500 |
| 错误 | 红色 | #FF3B30 |
| 背景 | 白色 | #FFFFFF |
| 文本 | 深灰 | #1A1A1A |

### 间距规范

- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)

### 圆角规范

- sm: 0.375rem (6px)
- md: 0.5rem (8px)
- lg: 0.75rem (12px)
- xl: 1rem (16px)
- 2xl: 1.5rem (24px)

## 添加新工具

### 第一步：注册工具

编辑 `src/js/tools-registry.js`，在 `tools` 数组中添加：

```javascript
{
  id: 'tool-id',
  name: '工具名称',
  category: 'finance', // 或 convert, usa, lifestyle
  icon: '🔧',
  description: '工具描述',
  path: '/tools/tool-id/',
  featured: false  // 是否在首页展示
}
```

### 第二步：创建工具页面

在 `tools/tool-id/` 目录下创建 `index.html`，参考模板：

```bash
cp docs/tool-page-template.html tools/tool-id/index.html
```

### 第三步：更新地图

更新 `sitemap.xml` 添加新工具的 URL。

## 发布流程

### 1. 本地测试

```bash
# 启动本地服务器
python3 -m http.server 8080

# 访问 http://localhost:8080 并完整测试所有功能
```

### 2. 提交变更

```bash
git add .
git commit -m "feat: 描述你的改动"
git push origin feature/your-feature
```

### 3. 创建 Pull Request

在 GitHub 上创建 PR 并通过审核。

### 4. 合并到 main

```bash
git checkout main
git merge feature/openaa-redesign
git push origin main
```

### 5. 验证发布

访问 https://tools.openaa.com 并验证所有内容。

## 常见问题

### Q: 如何修改品牌颜色？
A: 编辑 `src/styles/brand.css` 中的 CSS 变量 `--color-primary` 等。

### Q: 如何修改导航菜单？
A: 编辑 `index.html` 中的 `<nav class="openaa-nav">` 部分。

### Q: 如何添加新的工具分类？
A: 在 `src/js/tools-registry.js` 中的 `categories` 数组中添加新分类。

### Q: 工具页面为什么显示不对？
A: 确保在 `<head>` 中引入了所有必要的样式表，并在 `</body>` 前引入了必要的脚本。

## 浏览器支持

- Chrome/Edge: 最新两个版本
- Firefox: 最新两个版本
- Safari: 最新两个版本
- iOS Safari: iOS 12+
- Android Chrome: Android 6+

## 性能目标

- 首页首次内容绘制 (FCP): < 1.5s
- 最大内容绘制 (LCP): < 2.5s
- 累积布局偏移 (CLS): < 0.1
- Lighthouse 评分: > 90

## 支持与帮助

- 📧 邮件：contact@openaa.com
- 🐛 问题反馈：https://github.com/alititi-jackie/openaa-tools/issues
- 💬 讨论：https://github.com/alititi-jackie/openaa-tools/discussions
- 🌐 官网：https://www.openaa.com

## 许可证

MIT License - 详见 LICENSE 文件

## 更新日志

### v1.0.0 (2026-09-29)
- 🎉 项目从 ToolKu 完整改造为 OpenAA 工具库
- ✨ 实现全新的 OpenAA 品牌设计系统
- 🎨 重构首页、404 和工具导航页
- 🔍 优化 SEO 和站点配置
- 📱 完整响应式设计支持
- 🚀 准备上线到 tools.openaa.com

