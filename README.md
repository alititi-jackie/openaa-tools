# OpenAA 工具库

[tools.openaa.com](https://tools.openaa.com) 是 OpenAA 旗下无需注册的中文在线工具库，提供美国生活、日常生活、图片、DMV证件、汽车、单位换算和工资理财工具。主站为 [openaa.com](https://openaa.com)，本仓库为 `openaa-tools`。

本站使用Astro构建静态HTML，交互在浏览器按需加载。大多数计算和文件处理在本机完成，但邮编/区号等查询、主站统计及外链需要网络；不能将“静态站”理解成“完全不联网”。目前没有登录、服务端业务数据库或跨设备自动同步。

## 1. 当前规模与内容入口

以 [src/data/tools.json](src/data/tools.json) 为唯一在用工具注册表；当前有 **60个工具、7个分类**：

| 分类 | ID | 注册工具数 |
| --- | --- | ---: |
| 美国生活 | `usa` | 8 |
| 日常生活 | `life` | 20 |
| 图片工具 | `image` | 2 |
| DMV与证件 | `dmv` | 4 |
| 汽车出行 | `auto` | 5 |
| 单位换算 | `convert` | 8 |
| 工资与理财 | `finance` | 13 |

数量是当前注册数据快照，新增工具后须同步核对。不要按`features`文件数量或历史素材说明推断已上线工具。

首页`/`是唯一工具目录，支持`category`、`q`参数进行分类和搜索，空分类隐藏；原`/tools/`目录页已删除，没有兼容跳转。现有工具保留各自在注册表中的`/tools/.../`或`/usa/.../`地址。

DMV四个历史`.html`地址必须保留：

```text
/usa/dmv/6-points-calculator.html
/usa/dmv/document-checker.html
/usa/dmv/real-id-checker.html
/usa/dmv/real-id-vs-standard-vs-enhanced.html
```

攻略内容分为：

- [seo-guides.json](src/data/seo-guides.json)：40篇DMV攻略，路由为`/usa/dmv/<slug>/`。
- [tool-guides/](src/data/tool-guides/)：当前42份JSON文件、424篇工具攻略，路由为`/tools/<toolIds[0]>/<slug>/`；其中可含不同语言文章。
- [guides.ts](src/data/guides.ts)：统一内容入口，关联工具、来源、范围与文章路径。

另有`/privacy/`、`/404.html`，构建生成`/sitemap.xml`和`/release.json`。攻略是工具的内容补充，不应与对应工具URL混淆。

## 2. 环境与本地开发

需要 **Node.js 24、npm、Python 3**；与GitHub Actions中的Node版本保持一致。Astro、TypeScript和浏览器测试依赖以 [package.json](package.json) 与 [package-lock.json](package-lock.json) 为准。

```sh
git clone https://github.com/alititi-jackie/openaa-tools.git
cd openaa-tools
npm ci
npm run dev
```

默认开发端口为4321，以终端实际地址为准。`dev`和`preview`脚本绑定`0.0.0.0`，需要仅本机访问时请检查运行环境的网络暴露范围。开发运行不需要Supabase凭据或主站service-role key。

站点域名来自 [src/config/site.ts](src/config/site.ts) 和 [astro.config.mjs](astro.config.mjs)，同时用于页面metadata和构建产物；不是通过运行时环境变量动态切换。localhost可开发，但canonical等绝对地址仍指向正式工具域名。更换主域需同时检查配置、postbuild、robots、CNAME和测试，不能只改一处字符串。

## 3. 命令与验证边界

| 命令 | 职责 |
| --- | --- |
| `npm run dev` | Astro开发服务 |
| `npm run check` | Astro / TypeScript检查 |
| `npm test` | Node测试：计算、注册表、DMV判断、备份、存储、时间与部分SEO内容约束 |
| `npm run build` | `astro build`之后执行`postbuild`，生成完整`dist/` |
| `npm run preview` | 预览已构建的网站；不会代替postbuild |
| `npm run validate` | check → Node测试 → 完整build → Python静态产物校验 |
| `npm run test:e2e` | 手机与桌面Playwright测试，使用已构建的`dist/` |
| `npm run format` | Prettier直接改写匹配的源码/文档；使用后审查差异 |

```sh
npm run validate
npx playwright install chromium
npm run test:e2e
```

本地浏览器测试会由`playwright.config.mjs`启动Python静态服务，地址为`http://127.0.0.1:4321`，根目录是`dist/`。运行前先生成最新完整产物，并释放该端口；本地配置可复用已有服务，不要让旧dev服务占端口导致测试错站。`CHROMIUM_PATH`可指定已有兼容Chromium，系统依赖安装取决于环境权限。

`validate`**不包含**浏览器测试、依赖安全审计、联网供应商可用性或官方规则人工复核。安全审计另用`npm audit`或`npm audit --omit=dev`；通过一次检查不等于永久无告警。

若只查看真实静态产物，可运行：

```sh
npm run build
python3 -m http.server 4321 --bind 127.0.0.1 --directory dist
```

Windows等环境若只有`python`或`py`命令，需提供可用的`python3`或在本机调整调用；`validate`和Playwright配置当前直接使用`python3`。

## 4. 目录与架构

| 路径 | 用途 |
| --- | --- |
| `src/config/site.ts` | 站点名称、正式域名、OpenAA主站地址 |
| `src/data/tools.json` | 唯一工具注册表，驱动首页、工具路由和关联信息 |
| `src/data/tools.ts` | 注册表类型、7类展示顺序、相关工具组合逻辑 |
| `src/features/*.html` | 构建时读入的受版本控制正文片段，不是整页模板 |
| `src/features/*.js` | 复杂工具交互，按模块动态加载 |
| `src/lib/calculators/functions/` | 各计算器入口；共用输入/格式逻辑位于上级目录 |
| `src/lib/site.ts` | 公共交互启动、分享、导入/恢复、打印、模块加载等 |
| `src/lib/records.js`、`backup.js` | 记录读写、备份校验、导入快照 |
| `src/lib/engage.js` | 收藏、最近使用和通用计算历史 |
| `src/data/rules/` | 有年份的计算参数，不能当作自动更新的官方数据 |
| `src/data/seo-guides.json`、`tool-guides/` | DMV与其它工具攻略源 |
| `src/layouts/`、`src/components/` | metadata、页头页脚、工具/攻略布局、公共导航 |
| `src/pages/` | Astro静态路径：首页、工具、攻略、隐私、404 |
| `public/` | 图标、域名文件、manifest、保留的worker和本地资源 |
| `scripts/postbuild.mjs` | `.html`兼容、sitemap、release标记、工具作用域离线worker |
| `scripts/validate-site.py` | 检查实际静态产物的metadata、H1、内部资源和sitemap |
| `scripts/verify-production.mjs` | 正式发布版本、攻略/DMV页面及部分真实交互验收 |
| `tests/` | Node测试及`tests/browser/`浏览器测试 |

页面在构建时将固定HTML片段放入公共布局，浏览器再按注册模块加载交互。不要接收用户任意HTML作为此类构建片段；用户记录展示仍需转义和输入校验。详见 [架构与新增内容](docs/ARCHITECTURE.md)。

## 5. 新增工具与攻略

新增工具应同步维护：

1. 在`src/features/`添加正文片段，保留一个H1、明确label、错误/结果提示和手机布局。
2. 在`tools.json`注册唯一id、稳定path、分类、描述、模块及样式；新增分类还需调整`tools.ts`及分类UI。
3. 简单计算器在`src/lib/calculators/functions/<id>.js`导出`calculate`并注册`calculator`模块；复杂交互用独立feature模块。
4. 核对相关工具、攻略与生态链接；不要复制页头页脚、手写第二份注册表或改变已有公共URL。
5. 增加有意义的计算边界/输入测试，执行`validate`及需要的浏览器回归。

新增攻略应编辑对应内容JSON，填写`slug`、title、description、toolIds、正文、FAQ、reviewed及适用的来源/语言。`toolIds[0]`决定主路径，其余关联只影响互链；改顺序可能改变已有文章URL，必须当作路由变更审查。DMV专属攻略仍由独立注册表生成，不能混用另一套路径。

页面通过公共`GuideLayout`生成，工具会列出关联攻略。新增文章后验证页面唯一性、工具关联、canonical和sitemap；不要直接编辑`dist/`中的HTML。税务、工资、DMV和景点资料的核实日期必须来自实际复核，不能因部署或排版更新而刷新成“已核实”。参见 [DMV攻略框架](docs/dmv-seo-framework.md)。

## 6. 本地数据、备份与隐私

本站不自动把工具记录同步到主站或其它设备。记录属于**当前域名、当前浏览器**；换域名、换浏览器或清理网站数据，都可能使原记录无法继续读取。

| 存储键 / 类型 | 用途 |
| --- | --- |
| `openaa_expense_records_v1` | 记账原记录，必须保留兼容 |
| `openaa_usd_rmb_records_v1` | 汇率记账原记录，必须保留兼容 |
| 上述键加`_before_import` | 最近一次导入前快照；本机快照不是独立备份 |
| `openaa_tools_fav_v1` | 工具收藏 |
| `openaa_tools_recent_v1` | 最近使用，当前最多8项 |
| `openaa_tools_hist_<id>_v1` | 通用近期计算历史，通常最多5项；个别工具有专用处理 |

记账/汇率备份导入检查文件大小、格式、日期、金额、分类、ID与记录上限，校验成功后才写入。当前限制为5MiB文件、最多10000条记录。导入前保留恢复快照，快照失败时不继续覆盖；恢复入口位于数据备份界面。清理浏览器数据会同时删除原记录与快照，应定期下载独立备份。

存储损坏或写入失败应停止涉及原记录的操作并提示，不得用空数组覆盖未知记账/汇率数据。收藏等轻量记录有各自容错逻辑，不要把所有工具都描述为同一种恢复机制。分享、导出前由用户检查内容，不能把输入、记录或计算结果放入公开metadata或统计参数。更多约定见 [QUALITY.md](docs/QUALITY.md)，页面说明见`/privacy/`。

## 7. 外部依赖与规则来源

| 功能 | 当前依赖 / 边界 |
| --- | --- |
| 美国邮编查询 | `api.zippopotam.us`，发送用户输入的邮编；供应商故障需明确提示 |
| 电话区号查询 | `areacode.fyi`，发送输入区号；自动化mock不证明实时可用 |
| 计算/汇率记录 | 使用工具输入和本地规则；不能将手动汇率当作实时市场行情 |
| 二维码/图片处理 | 相关实现和资源位于本仓库，二维码解码加载本地vendor资源；各工具行为以实际模块为准 |
| 地图、官方材料及生态链接 | 跳转外部网站，受其网络和隐私政策影响 |
| 页面统计 | 公共布局加载`https://openaa.com/analytics/tracker.js`；统计接收与后台属于主站 |

不要因静态构建成功就声称外部API、税务参数、DMV要求或景点信息已全部重新核实。规则变更应保留官方来源、适用范围、年份/复核日期并补充边界测试。第三方素材和库还需检查 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) 及各资源来源；历史notice不等于对应工具当前仍在注册表中。

## 8. PWA与离线范围

当前源模块会在以下三个工具页面注册各自的worker：

- `/usa/expense-record/sw.js`
- `/usa/usd-rmb/sw.js`
- `/usa/nyc-attractions/sw.js`

它们由postbuild生成，以工具URL作为作用域，各自只清理自己的缓存前缀。预缓存工具页、manifest、图标和构建资源；当前实现还将`dist/_astro/`下全部JS/CSS纳入缓存，并非只分析该工具最小依赖。导航优先联网，断网回退缓存；外部查询和外链不会因此离线可用。

`public/sw.js`是另一个保留的根worker文件，但当前公共入口没有注册它。不能仅凭该文件和根manifest存在，就声称全站已经启用离线缓存。主站和DMV站的worker策略也不等于本仓库策略。

添加到桌面不代表整站永久离线或浏览器一定显示原生安装框。首次下载、worker激活、作用域、资源加载和浏览器限制都会影响结果。缓存升级不得删除localStorage；应用代码回滚也不会恢复被用户清理的记录。

## 9. 完整构建与部署

**必须使用`npm run build`，不能只执行`astro build`就发布。** postbuild会：

1. 将四个历史`.html`工具路径变成实际文件，兼容静态托管。
2. 按工具与攻略注册数据生成`sitemap.xml`。
3. 生成`release.json`，记录commit、攻略数量、规则标签和构建时间。
4. 为三个独立工具生成worker及缓存版本。

CI中commit来自`GITHUB_SHA`；本地未设置时release标记为`local`。构建时间不是文章内容复核时间，规则标签也不是自动联网核验结果。

[GitHub Actions工作流](.github/workflows/static.yml) 当前分三阶段：

| 阶段 | 实际行为 |
| --- | --- |
| build | `npm ci` → validate → 安装Chromium → 手机/桌面e2e → 上传`dist/`；失败时保留测试产物 |
| deploy | 仅main且非PR事件，在build成功后部署至GitHub Pages |
| production-acceptance | 部署后核对正式域名release commit、DMV工具、全部攻略路由/metadata/sitemap及部分真实交互 |

生产验收中的攻略数量从注册数据读取，不能因步骤历史名称含“forty”就认为只检查40篇。脚本有有限重试等待Pages/CDN传播；失败不能自动认定代码已回滚。

仓库Settings → Pages应选GitHub Actions，绑定`tools.openaa.com`，并核对DNS、HTTPS和正式域名实际托管位置。`public/CNAME`不是DNS配置，也不能证明域名已指向此部署；避免其它托管平台同时提供旧目录。

有需要时，可在已安装测试依赖和浏览器的环境单独运行：

```sh
node scripts/verify-production.mjs
```

可配置`PRODUCTION_URL`和`GITHUB_SHA`；未设置预期commit时不会验证指定版本完全一致，不能将这次结果描述为“已验收某个提交”。该脚本包含真实页面交互，应先读脚本并使用明确选择的目标环境，不把它等同于纯HTTP存活检查。

## 10. 发布验收、回滚与排查

发布后核对：

- `release.json`是否对应预期提交，实际域名与Pages部署是否一致。
- 首页搜索/分类、收藏/最近使用、关键计算和错误提示。
- 四个DMV历史`.html`路径、工具攻略路由、metadata、sitemap与未知路径404。
- 记账/汇率导入导出及恢复、存储受限提示；用隔离测试数据，不覆盖真实用户记录。
- 手机/桌面布局、弹窗、分享、打印、下载/安装和已有worker升级。
- 外部查询的真实成功/失败行为，与规则人工核验分开记录。

回滚优先revert相关提交并重新部署，保留历史。不要为回滚清理用户localStorage；同时检查旧缓存、构建commit、已有URL和备份格式的兼容性。

| 现象 | 先检查 |
| --- | --- |
| 文档数量与页面不符 | `tools.json`、`tools.ts`分类、两类攻略注册表；不要手写第二份清单 |
| `.html`地址打不开 / 没有worker | 是否跳过postbuild、是否发布了完整`dist/` |
| e2e测试到旧页面 | 4321端口是否被已有dev/旧静态服务占用、`dist/`是否最新 |
| 部署成功但正式站仍旧 | 实际托管域名、CDN传播、`release.json`预期commit、旧worker |
| 数据读取/导入失败 | 先导出或保留原始数据，检查格式、大小、日期、重复ID及存储空间 |
| 查不到区号/邮编 | 输入格式、第三方服务、网络/CORS；区分无数据和服务失败 |
| 规则结果有疑问 | 规则源、适用年份与范围、实际来源复核；不能只调整页面说法 |

修改工具、攻略、存储、PWA、命令或部署方式时，同步更新README及模块文档。结构/测试通过不等于官方规则全部准确、外部接口持续可用或搜索收录/排名有保证。

进一步阅读：[架构与新增内容](docs/ARCHITECTURE.md) · [功能维护约定](docs/QUALITY.md) · [DMV攻略框架](docs/dmv-seo-framework.md)。
