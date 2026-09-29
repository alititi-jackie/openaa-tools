# OpenAA 工具库

OpenAA 旗下的免费在线工具集合，部署地址：<https://tools.openaa.com>。

## 当前改造状态

本次 `feature/openaa-redesign` 分支完成了第一轮品牌重构：

- 重建 OpenAA 品牌设计系统：`src/styles/brand.css`
- 新增公共布局、导航、英雄区、卡片和页脚样式：`src/styles/layout.css`
- 新增工具详情页通用样式：`src/styles/tool-page.css`
- 新增首页应用逻辑与移动端菜单：`src/js/app.js`
- 新增工具注册配置：`src/js/tools-registry.js`
- 重构首页：`index.html`
- 重构 404 页面：`404.html`
- 重构工具导航页，支持搜索与分类筛选：`tools/index.html`

## 本地预览

这是一个无需构建步骤的静态 GitHub Pages 网站，可使用任意静态服务器预览：

```bash
python3 -m http.server 8080
```

然后打开 <http://localhost:8080>。

## 目录约定

- `src/styles/`：品牌和公共页面样式
- `src/js/`：公共前端逻辑与工具目录配置
- `tools/`：工具导航及各个工具页面
- `usa/`：美国地区相关工具
- `scripts/`：站点校验脚本
- `tests/`：计算器逻辑测试

## 发布

GitHub Pages 应继续从 `main` 分支发布。完成验收后，将 `feature/openaa-redesign` 合并到 `main`，并在 DNS 中将 `tools.openaa.com` 的 CNAME 指向 GitHub Pages 提供的域名。

## 后续工作

1. 将现有工具详情页的 ToolKu 文案、标题和 JSON-LD 统一替换为 OpenAA。
2. 为全部工具补充工具注册信息，并校准导航页的分类数量。
3. 将工具页公共头部和页脚抽取为可复用模板，减少重复 HTML。
4. 增加页面链接检查、移动端回归测试和 SEO 校验。
