# OpenAA 工具库

OpenAA 旗下免费中文在线工具，正式域名 **https://tools.openaa.com**。

41 个工具，统一 OpenAA 品牌、静态 HTML、按需加载交互。保留原 `/tools/.../` 与 `/usa/...` 地址，以及已有记账和汇率记录格式。

## 开发

需要 Node.js 24、npm 和 Python 3（静态产物检查）。

```sh
npm ci
npm run dev
```

```sh
npm run validate
npx playwright install chromium
npm run test:e2e
```

`npm run build` 生成 `dist/`。发布或预览必须使用完整 build 流程，postbuild 会保留四个 `.html` 工具网址及生成离线 worker。可用 `python3 -m http.server 4321 --directory dist` 检查实际产物。

## 部署

GitHub Actions 对 PR 执行检查、计算测试、静态构建和手机/桌面浏览器测试；仅 main 分支成功后发布 `dist/` 到 GitHub Pages。仓库 Settings → Pages 应使用 GitHub Actions，并核对自定义域名 `tools.openaa.com`、DNS 与 HTTPS。代码中的 CNAME 不能代替 DNS/托管设置。

上线前核对正式域名当前指向的实际托管项目，避免在其他托管平台仍部署旧目录。

详见 [架构与新增工具](docs/ARCHITECTURE.md) 和 [迁移验收](docs/MIGRATION.md)。
