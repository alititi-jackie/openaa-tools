# OpenAA工具库架构

正式域名为`https://tools.openaa.com`，所属平台为`https://openaa.com`。Astro构建完整静态HTML，浏览器加载工具交互；本仓库没有登录、服务端业务数据库或用户云同步。

当前注册60个工具、7个分类，另有40篇DMV攻略和424篇工具攻略。数量随内容更新，以注册数据为准，入口与运行/发布命令见[主README](../README.md)。

## 页面与模块

- `src/config/site.ts`、`astro.config.mjs`：品牌与正式主域；postbuild、robots及CNAME也要保持一致。
- `src/data/tools.json`：唯一工具注册表，生成首页分组、工具静态路径和sitemap项。
- `src/data/tools.ts`：类型、7类顺序和相关工具组合；不能手写第二份在用清单。
- `src/features/*.html`：受版本控制的正文片段，通过`?raw`构建，不包含公共head/header/footer；不接收用户任意HTML。
- `src/features/*.js`：复杂功能，按页面模块动态导入。
- `src/lib/calculators/functions/`：简单计算工具的独立入口，输入与格式逻辑可复用上级模块。
- `src/layouts/`、`src/components/`：工具/攻略公共布局、导航、metadata和展示组件。
- `src/data/seo-guides.json`：DMV攻略；`src/data/tool-guides/*.json`：其它工具攻略；`guides.ts`统一路径和关联。
- `src/lib/records.js`、`backup.js`：本地记录、导入校验与快照；用户数据展示仍需转义。
- `src/lib/engage.js`：收藏、最近使用和计算历史。
- `src/data/rules/tax-2026.js`：有年份的规则参数；更新须核对来源和边界，不是实时规则服务。
- `scripts/postbuild.mjs`：四个`.html`兼容、sitemap、release标记与三个工具的worker。

## 新增工具

1. 在features添加正文，保留一个H1、明确label和输入/结果提示。
2. 注册唯一id、稳定path、分类、描述、模块、样式；新增分类还需维护`tools.ts`。
3. 简单计算器导出`calculate`，注册`calculator`；复杂功能使用独立feature模块。
4. 核对相关工具/攻略及生态链接，补计算或输入边界测试。
5. 运行`npm run validate`与所需的`npm run test:e2e`。

## 攻略路由

DMV攻略为`/usa/dmv/<slug>/`。其它工具攻略为`/tools/<toolIds[0]>/<slug>/`；主工具顺序改变会改变URL，需要按路由变更审查。公共GuideLayout渲染页面，工具页自动列出关联文章。新增内容同步验证唯一性、canonical、工具关联、sitemap与来源日期。

## URL兼容与构建

工具URL来自注册表，不能按id推断所有路径都相同。四个DMV`.html`路径由postbuild转为实际文件，其余以目录HTML输出。首页是唯一工具目录，旧`/tools/`目录页没有兼容跳转；`/tools/<工具>/`和攻略路径仍有效。

只发布完整`npm run build`产出的`dist/`，不直接发布源码、不跳过postbuild、不手改生成文件。

## 记录与缓存

保留`openaa_expense_records_v1`、`openaa_usd_rmb_records_v1`和备份格式；同origin同浏览器才可继续读取。导入前快照不能替代独立下载备份，存储损坏时不得以空记录覆盖原数据。

三个`/usa/<tool>/sw.js`分别服务记账、汇率记录、纽约景点页面。每个worker只清理自己的缓存前缀；预缓存工具壳和构建资源，当前还包含全部`_astro` JS/CSS，非最小依赖集。缓存升级不可清理localStorage。保留的根`public/sw.js`在当前公共入口没有注册，不能据文件存在断言全站离线已启用。

## 规则与联网服务

区号、邮编查询依赖第三方接口，自动化mock不代表线上供应商可用。主站统计脚本、官方资料和地图等外链也依赖网络。税务、DMV、金融和景点规则必须单独核实来源、年份与范围，构建/重构不等于重新核验。
