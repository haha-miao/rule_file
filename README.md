# rule_file

面向 Xboard、Surge、Clash/Stash、soga 和图标订阅使用的公共资源仓库。

这个仓库主要提供几类公共资源：

- `examples/`：Xboard 使用的默认客户端配置模板。
- `surge/`：Surge 规则源文件，按服务或用途分组。
- `clash/`：由 Surge 源规则生成的 Clash YAML 规则文件。
- `soga/`：soga Docker、DNS、审计规则和多路由多出口示例。
- `icons/` 与 `icons.json`：图标文件和图标索引。

## 快速使用

### 图标索引

图标索引：

```text
https://raw.githubusercontent.com/haha-miao/rule_file/main/icons.json
```

单个图标可以直接按文件名引用：

```text
https://raw.githubusercontent.com/haha-miao/rule_file/main/icons/google_01.png
```

`icons.json` 会从 `icons/` 自动生成，图标名称等于文件名去掉扩展名。例如：

```text
icons/google_2026_new_gmail_01_png.png
```

对应索引名：

```text
google_2026_new_gmail_01_png
```

### 默认模板

默认模板主要给 Xboard 使用：

| 客户端 | 文件 |
| --- | --- |
| Surge | `examples/default.surge.conf` |
| Surfboard | `examples/default.surfboard.conf` |
| Clash | `examples/default.clash.yaml` |
| Stash | `examples/default.stash.yaml` |

这些模板会尽量保持同一套策略组和规则逻辑。不同客户端因为语法和 Xboard 模板字段不同，写法可能不完全一样。

### 规则文件

Surge 源规则在 `surge/`，Clash 生成规则在 `clash/`。

目前主要分组：

| 分组 | 用途 |
| --- | --- |
| `extra` | 规则修正层，例如额外直连 |
| `emby` | Emby 直连和代理规则 |
| `crypto` | 加密货币相关服务 |
| `appleai` | Apple Intelligence 相关规则 |

每个规则目录下的 `README.md` 会列出统计和 raw 链接。示例：

```text
https://raw.githubusercontent.com/haha-miao/rule_file/main/surge/extra/extra-direct.list
https://raw.githubusercontent.com/haha-miao/rule_file/main/clash/extra/extra-direct.yaml
```

### soga 示例

`soga/` 目录提供 soga 相关示例：

| 文件 | 用途 |
| --- | --- |
| `compose.yml` | Docker Compose 启动示例 |
| `dns.yml` | DNS 配置示例 |
| `blockList` | 审计规则 |
| `routes.toml` | 多路由多出口基础示例 |
| `routes.geo.toml` | 地域和服务组合路由示例 |
| `AI.toml`、`US.toml`、`HK.toml` 等 | 按服务或地区拆分的路由片段 |

soga 配置通常涉及真实 IP、出口路由、Redis 限制、远程规则加载和 Geo 数据更新。直接套用前请先理解自己的面板、节点和网络环境。

## 目录说明

```text
.
├── clash/                 # 由 surge/ 生成的 Clash YAML 规则
├── examples/              # Xboard 默认客户端模板
├── icons/                 # 图标文件
├── icons.json             # 图标索引，由脚本生成
├── scripts/               # 规则和图标生成脚本
├── soga/                  # soga 配置示例
└── surge/                 # Surge 规则源文件
```

## 使用提醒

- `examples/` 里的配置主要面向 Xboard 模板场景；直接导入客户端前，请先确认自己的客户端和转换层支持对应字段。
- `surge/` 和 `clash/` 的规则按服务分组维护，使用时请注意规则顺序和上游 `RULE-SET` 的匹配关系。
- `soga/` 是示例配置，不建议不理解参数含义就直接用于生产环境。
- raw 链接默认指向 `main` 分支，发布后的内容会通过 GitHub raw 地址直接生效。
