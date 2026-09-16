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

## 1.1.15 安装验收

- 在独立临时状态目录及配置中，通过官方 `plugins install` 安装 ZIP，未使用现有账号凭据。
- `plugins inspect kling-ai --json` 确认版本 `1.1.15`、`format: openclaw`、`status: loaded`，Skills/MCP 能力存在且 `diagnostics` 为空。
- 本次未重新进行浏览器 OAuth 授权或计费生成；上述登录及远端探测结果来自此前验证。

## 仍需真实环境验收

1. OAuth access token 到期后的自动续期。
2. 实际读取账号身份与额度，并核对账号区域。
3. 在用户明确提出生成请求后，验证单次提交、任务查询、图片/视频结果与失败行为。
4. 分别验证 Control UI 的 MCP App 与目标消息渠道的文本/媒体回落；不能假设所有渠道支持 App 或 MEDIA 指令。

上述计费生成和多渠道验收仍未执行，不将当前包标记为已完成生产联调。
