# OpenAA 工具库

正式域名：https://tools.openaa.com。所属平台：https://openaa.com。

## 架构

Astro 在构建时生成完整 HTML。41 个既有工具 URL 保持不变；页面模板、SEO、页头页脚、目录卡片和分享由公共组件提供。工具正文是受版本控制的 HTML 片段，使用 `?raw` 在构建时读入，不接受用户提交的 HTML。用户记录仍由各功能模块转义后展示。

- `src/config/site.ts`：品牌和域名。
- `src/data/tools.json`：唯一工具注册表；首页、目录、路由、相关工具、站点地图从这里生成。
- `src/features/*.html`：工具专属表单与说明，不包含整页 head/header/footer。
- `src/features/*.js`：独立工具交互，通过动态导入按需加载。
- `src/lib/calculators/functions/`：各计算工具独立入口；共享格式化和输入处理在上级目录。
- `src/data/rules/tax-2026.js`：迁移保留的税务参数。规则更新必须核对官方来源及年份并补充边界测试。
- `src/lib/records.js`：本地日期、记录读写和失败提示。
- `src/layouts/`、`src/components/`：共享页面结构。
- `src/styles/global.css`：OpenAA 设计变量和公共样式；`styles/tools/` 保留复杂工具的专属布局。
- `public/`：正式主站 Logo、图标、PWA 清单和域名配置。
- `scripts/postbuild.mjs`：兼容原有 `.html` 路由、生成 sitemap 和每个已安装工具的离线缓存。

## 新增工具

1. 在 `src/features/` 新增正文片段，含一个 h1，输入框使用明确 label。
2. 在 `src/data/tools.json` 注册唯一 id、path、分类、描述及所需模块和样式。
3. 简单计算器在 `src/lib/calculators/functions/<id>.js` 导出 `calculate`，注册 `calculator` 模块。复杂功能使用独立 feature 模块。
4. 添加有意义的计算/输入测试。运行 `npm run validate` 和 `npm run test:e2e`。

不要复制公共页头页脚，不要手写第二份工具清单，不要把用户数据写入页面元数据或统计参数。

## 记录兼容

保留 `openaa_expense_records_v1` 和 `openaa_usd_rmb_records_v1`；保留原备份导入格式。同域名同浏览器原记录可继续读取。本站独立使用 `tools.openaa.com`，不与其他工具品牌关联。存储损坏或写入失败时停止操作并显示提示，不能用空数组覆盖未知数据。

## 离线缓存

保留原有三个 `/usa/<tool>/sw.js` 地址和作用域。每个工具只删除自己的 OpenAA/旧版缓存前缀，保留其他工具缓存。预缓存构建后的页面、图标和实际 JS/CSS 依赖；导航优先联网，断网回退。浏览器在新 worker 激活后可更新旧版本。缓存是页面资源，不是用户记录；记录不可由缓存升级清理。

## 规则与第三方服务

这次重构保留原工具的计算和 DMV 规则，不视为对所有法律、税务、官方要求和景点资料的重新核验。页面已有来源和日期保留。邮编和区号依赖第三方接口；自动化测试用模拟响应覆盖成功及失败，不能替代线上供应商可用性检查。
