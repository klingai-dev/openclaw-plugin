# 兼容性与验收范围

本次仅创建 OpenClaw 安装包装；没有修改其他宿主共享实现。Skills 来源为仓库 workbuddy/workbuddy 的三个 Skills 和引用资料，调整宿主名称、OAuth、工具发现和媒体投递说明。

本包使用 OpenClaw 原生声明式插件格式：`openclaw.plugin.json` 直接声明 `skills/` 和远程 `mcpServers`，最小入口不注册额外工具、Hook 或本地服务。

发布后优先使用 `openclaw plugins install clawhub:kling-ai-openclaw`；Git 源仍可用于开发版本。远程 MCP 地址、OAuth、超时和并发策略由插件清单提供默认值，操作员配置可以覆盖；登录、刷新和退出均由 OpenClaw 原生 OAuth 管理。插件不假定固定用户目录。

依据：[插件安装](https://docs.openclaw.ai/cli/plugins/install)、[原生清单](https://docs.openclaw.ai/plugins/manifest)、[MCP OAuth](https://docs.openclaw.ai/cli/mcp/transports)。官方在线文档可能随版本更新；命令选项已对照本机 OpenClaw 2026.9.4 CLI 帮助。

## 已覆盖的静态检查

- 原生插件清单、最小入口和远程 MCP 结构；单一国内端点和专属 server key。
- 三个 Skill 的 frontmatter、宿主名称、引用文件及无旧 /mcp/plugin 地址。
- 分发内容白名单与无本地 MCP runtime、凭据文件。
- 本机 OpenClaw 2026.9.4 的实际格式检测与 MCP transport 解析。

## 已覆盖的真实环境检查

- OpenClaw 2026.9.4 能完成可灵 OAuth 动态客户端注册、浏览器授权、loopback 回调和凭据保存。
- 插件默认值与同名操作员 OAuth 配置合并后只暴露一个 `kling-ai` 服务。
- `openclaw mcp doctor kling-ai --probe` 返回 `ok`。
- `openclaw mcp probe kling-ai --json` 能发现图片、视频、上传、Element、动作库、额度及任务查询能力，且诊断为空。
- 登录包装脚本能自动打开浏览器，并对授权域名、已登录、CLI 失败和浏览器打开失败执行回归测试。

## 1.1.17 安装验收

- 在独立临时状态目录及配置中，通过官方 `plugins install` 安装 ZIP，未使用现有账号凭据。
- `plugins inspect kling-ai --json` 确认版本 `1.1.17`、`format: openclaw`、`status: loaded`，Skills/MCP 能力存在且 `diagnostics` 为空。
- 本次未重新进行浏览器 OAuth 授权或计费生成；上述登录及远端探测结果来自此前验证。

## 仍需真实环境验收

1. OAuth access token 到期后的自动续期。
2. 实际读取账号身份与额度，并核对账号区域。
3. 在用户明确提出生成请求后，验证单次提交、任务查询、图片/视频结果与失败行为。
4. 分别验证 Control UI 的 MCP App 与目标消息渠道的文本/媒体回落；不能假设所有渠道支持 App 或 MEDIA 指令。

上述计费生成和多渠道验收仍未执行，不将当前包标记为已完成生产联调。

## 1.1.18 验收范围

补充 V4 / V4 Flash 实时发现、全能参考、条件素材上限及音频约束；本地检查不代表真实 OAuth 或付费生成已验收。上方 1.1.17 记录是历史证据，不覆盖本次版本。

## 1.1.19 MCP Apps 设置

- 三个 Skill 与安装说明新增宿主级开关检查、按用户授权开启、重启及页面挂载验证。原生插件安装不会开启该设置；没有增加启动时改配置的逻辑或本地渲染器。
- 国内、海外包升至 1.1.19。最低宿主/API 兼容与历史构建证据仍为 2026.9.4；新增 2026.10.6 稳定版升级指引，不代表已在该版完成运行验收。
- 依据：[OpenClaw 2026.10.6 MCP Apps](https://github.com/openclaw/openclaw/blob/v2026.10.6/docs/cli/mcp/apps.md)。UI 源码、MCP 端点、OAuth、计费及结果回落契约未改变。仍需在出问题的实例验证实际 UI；不得为此重新提交计费生成。

## 1.1.20

仅递增发布版本，保留 1.1.19 的 MCP Apps 设置说明及全部运行行为。因 ClawHub 扫描器执行失败导致 1.1.19 暂存占用，使用新版本重新走完整审核；不代表审核通过，也不绕过任何安全检查。

## 1.1.21

修正工具命名说明：区分 MCP 注册名与代码模式的下划线标识符，调用时遵循实际工具声明；安装与配置身份保持不变。无生成、OAuth 或 UI 运行时变更。

## 1.1.22

入口 Skill 由 `kling-ai-plugin` 改名为 `kling-ai`，避免与通用插件包的同名 Skill 冲突（OpenClaw 会将重名项显示为 `kling_ai_plugin_2`）。无生成、OAuth、MCP 或 UI 运行时变更。

## 1.1.23

入口 Skill 新增「与通用插件 Skill 共存」规则：同时存在 `kling-ai-plugin` 时以本 Skill 为准，不执行其 `query_tasks` 轮询和额外链接要求，避免出现第二张结果卡片。无生成、OAuth、MCP 或 UI 运行时变更。
