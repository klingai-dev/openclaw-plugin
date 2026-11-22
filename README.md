# Kling AI for OpenClaw

用国内可灵账号在 OpenClaw 对话里生成图片和视频。插件通过 OAuth 连接可灵官方 MCP，无需 API Key。

[国内 ClawHub](https://clawhub.ai/klingai-dev/plugins/kling-ai-openclaw) · [可灵官方 MCP 与 CLI 指南](https://klingai.com/app/mcp/guide) · [海外版 README](https://github.com/klingai-dev/openclaw-plugin/tree/global#readme)

## 快速开始

请先准备 OpenClaw `2026.9.4` 或更新的兼容版本，以及一个国内可灵账号。每个 OpenClaw 实例选择一个可灵接入方式和一个账号区域。[OpenClaw 安装指南](https://docs.openclaw.ai/install)

### 让 OpenClaw 帮你配置

将下面这段话发给能在 Gateway 所在环境执行终端命令的 OpenClaw 助手。浏览器授权时使用你的国内可灵账号。

```text
请按 https://github.com/klingai-dev/openclaw-plugin#readme 配置国内版可灵插件。
运行 openclaw plugins install clawhub:kling-ai-openclaw，按 README 注册 kling-ai MCP 服务，
引导我在浏览器授权，再通过可灵查询可用模型来验证连接。
```

### 安装插件

手动配置时，在运行 OpenClaw Gateway 的环境中执行以下命令。

```bash
openclaw plugins install clawhub:kling-ai-openclaw
```

安装后检查插件状态：

```bash
openclaw plugins inspect kling-ai --json
```

如果正在运行的 Gateway 没有自动加载插件，重启一次：

```bash
openclaw gateway restart
```

### 登录

首次使用时，先注册国内插件的 MCP 服务，供 OpenClaw 的登录命令使用。如果已有同名服务，先按[账号与区域](#账号与区域)检查地址。

```bash
openclaw mcp add kling-ai \
  --url https://klingai.com/mcp/plugin \
  --transport streamable-http \
  --auth oauth \
  --header X-Kling-Integration=Plugin-OpenClaw \
  --connect-timeout 30 \
  --timeout 60 \
  --no-probe
```

然后登录：

```bash
openclaw mcp login kling-ai
```

按终端提示打开授权链接，用国内可灵账号登录并授权。OAuth 凭据由 OpenClaw 管理。

授权后，运行以下命令检查服务配置和登录状态。看到 `kling-ai: ok` 后，可在新会话中试用。

```bash
openclaw mcp doctor kling-ai
```

### 生成第一个作品

在 OpenClaw 开一个新会话，发送：

```text
用可灵生成一张 1:1 的图片：清晨窗边的一杯咖啡，柔和自然光，写实摄影。
```

核对助手列出的模型、参数和额度提示，回复「确认生成」即可提交任务。生成完成后，可在会话中查看作品或打开结果链接。

## 开启交互 UI（MCP Apps）

插件安装本身不会开启 OpenClaw 的全局 MCP Apps 开关。要在 Control UI 显示可灵交互卡片，安装后执行：

```bash
openclaw config set mcp.apps.enabled true --strict-json
openclaw gateway restart
openclaw config get mcp.apps.enabled
```

该开关允许已配置 MCP 服务提供交互 HTML，重启会短暂中断 Gateway。返回 `true` 只证明配置已开启，仍需在页面验证 App 实际显示。可让 Agent 按本包 Skill 完成检查与设置；安装或发现 Skill 不会自动执行这些命令。

通过反向代理访问时，App 还需要独立来源与沙箱端口代理：默认 Gateway 为 `18789`，App 为 `18790`。按[官方 MCP Apps 配置](https://docs.openclaw.ai/cli/mcp/apps)设置 `mcp.apps.sandboxOrigin`，不要把 App 与 Control UI 配成同源。消息渠道不保证内嵌 UI。

如果宿主低于本插件的兼容版本，按 OpenClaw 的官方指引升级，再运行 `openclaw --version` 核对。[OpenClaw 更新指南](https://docs.openclaw.ai/install/updating)

只有原始工具文本时，检查开关、代理和会话调用路径；MCP 探测成功不等于 UI 已挂载。已提交任务保留任务编号，不要为了修 UI 重新生成。

## 功能

- 文生图、参考图编辑、变体和连续组图。可灵图片 4.0 支持原生 8K。分辨率和组图张数以当前账号的实时模型定义为准。[可灵图片 4.0 官方指南](https://kling.ai/quickstart/kling-image-4-user-guide)
- 文生视频、图生视频、全能参考、关键帧、动作控制和多镜头视频
- 上传参考素材，管理 Element 和动作库
- 查询账号、额度、任务状态和生成结果
- 提交生成任务前展示最终参数和额度提示，确认后只提交一次

## MCP configuration

For MCP clients that accept a JSON server configuration, the China service uses this OAuth-enabled Streamable HTTP endpoint:

```json
{
  "mcpServers": {
    "kling-ai": {
      "type": "streamable-http",
      "url": "https://klingai.com/mcp/plugin",
      "headers": {
        "X-Kling-Integration": "Plugin-OpenClaw"
      }
    }
  }
}
```

Sign in through the client's OAuth flow with a China-region Kling account. The Global service is documented in the [Global README](https://github.com/klingai-dev/openclaw-plugin/tree/global#readme) and uses a separate account region.

## Tools

The remote MCP server exposes these tools; availability and model capabilities can vary by account and region:

- `who_am_i`
- `query_membership_and_credits`
- `logout`
- `text_to_image`
- `image_to_image`
- `text_to_video`
- `image_to_video`
- `omni_ref_video`
- `motion_control`
- `query_tasks`
- `file_upload`
- `motion_library_list`
- `element_create`
- `element_list`
- `element_get`
- `element_update`
- `element_delete`
- `feedback`

## 视频生成

- **可灵 4.0（V4）** 支持文生视频、首帧／尾帧／中间关键帧图生视频，以及组合图片、视频、音频和 Element 主体的全能参考。支持 3–30 秒、720p，符合权限的账号可按实时声明选择 1080p 或 4K。
- **HDR 输出** 适用于标准版可灵 4.0 的文生视频、图生视频和全能参考。直接要求 1080p HDR 或 4K HDR，插件会按当前账号和模型的实时声明核对支持情况。720p 和 4.0 Flash 不支持 HDR。
- **可灵 4.0 Flash（V4 Flash）** 面向快速出片，支持文生视频、单张首帧图生视频，以及组合图片、视频和 Element 主体的全能参考。支持 3–20 秒、720p。
- 两款模型的全能参考均支持智能分镜、生成同步声音或保留参考视频原声。两种输出声音设置互斥。需要独立音频参考时，选择声明音频输入的可灵 4.0 全能参考。

## 使用

未指定图片模型时，优先使用当前账号可用且满足需求的可灵图片 4.0。4.0 不可用或不兼容时，优先使用图像入口返回的兼容默认模型。

未指定视频模型时，优先使用当前账号可用且符合需求的可灵 4.0 全能参考。速度或成本优先时，可选兼容的 Flash。纯文本视频请求也会同时检查文生视频和全能参考入口。

点名模型时按当前账号返回的完整型号匹配，规格、素材组合和计费以实时模型定义为准。

### 推荐提示词

- 使用可灵图片 4.0 一次生成 3 张 8K 连续组图。让同一只身穿复古宇航服的小熊猫依次从空间站出舱、掠过舷窗、转身望向蓝色地球
- 使用可灵 4.0 生成一段 20 秒电影感视频：机甲战士从高空重砸地面，冲击波瞬间震开碎石与尘雾，镜头快速推近，充满力量感
- 使用可灵 4.0 Flash，把我提供的运动鞋商品图作为首帧，生成一段 20 秒、720p 的视频，镜头缓慢绕过鞋身，最后停在鞋面细节上
- 使用可灵AI查看动作库，预览已保存的动作；选定后，用可用的动作控制模型将该动作应用到我提供的主体图片生成视频
- 使用可灵AI将我提供的角色正面图和侧面图保存为第一个可复用主体，命名为“小白”，方便后续创作时保持角色一致

提交前，插件会列出模型、尺寸或分辨率、时长、数量等最终参数，并说明会消耗可灵额度。收到明确确认后才会创建任务。

灵感值不足时，使用当前连接提供的官方充值入口，或在[国内可灵官网](https://klingai.com/)登录同一账号充值。充值后回到当前会话说「继续刚才的任务」。OpenClaw 会先处理已有任务，只有可以新提交时才核对余额并恢复原设置。

查询已有任务时提供 `generationId`：

```text
查询任务 <generationId> 的状态，不要重新提交。
```

## 更新

```bash
openclaw plugins update kling-ai
```

更新后如有需要，重启 Gateway 并开启新会话。

## 账号与区域

本插件使用国内可灵服务：

```text
https://klingai.com/mcp/plugin
```

国内和海外账号的额度及任务不互通。可以用 `openclaw mcp show kling-ai` 检查已注册的地址。如果地址属于另一地区，先退出旧连接，再用 `openclaw mcp unset kling-ai` 移除旧的手动配置，然后按[登录](#登录)注册并授权。若只是切换同区账号，执行：

```bash
openclaw mcp logout kling-ai
openclaw mcp login kling-ai
```

需要自动打开浏览器时，在已安装插件的目录运行：

```bash
npm run login
```

包内助手会调用 OpenClaw 的登录流程并打开国内可灵授权页。打开浏览器失败时，运行 `openclaw mcp login kling-ai`，将终端打印的授权链接复制到浏览器。

## 名称与下划线

OpenClaw 的 MCP 注册名与代码模式调用名不同：注册名可以保留 `kling-ai__text_to_image`，代码模式会把不合法的 JavaScript 标识符字符转换为下划线，例如服务标识可能显示为 `kling_ai`。调用时以当前会话的工具或命名空间声明为准，不要固定拼接前缀。

这个转换不适用于安装和配置：MCP 服务键仍为 `kling-ai`，插件 ID、Skill 名和包名保持本包原有拼写。不要把 `openclaw mcp login kling-ai` 改成下划线形式。

依据：[MCP 工具命名](https://docs.openclaw.ai/plugins/bundles#tool-naming)、[代码模式命名](https://docs.openclaw.ai/tools/code-mode/tool-surface)。

## 常用排查

```bash
openclaw plugins inspect kling-ai --json
openclaw mcp status --verbose
openclaw mcp doctor kling-ai
```

需要探测远端连接时，在 Gateway 停止期间运行 `openclaw mcp doctor kling-ai --probe`。[OpenClaw MCP 命令参考](https://docs.openclaw.ai/cli/mcp/registry)

- **登录提示找不到 `kling-ai`**。先执行[登录](#登录)里的注册命令，再重试授权。
- **会话里没有可灵工具**。开启新会话。工具仍未出现时，重启 Gateway 后再试。
- **只有文字，没有交互卡片**。检查 [MCP Apps 设置](#开启交互-uimcp-apps)。
- **提交超时或结果不明确**。用原 `generationId` 查询已有任务。没有任务编号时，保留 `taskTraceId`，等待确认提交状态。

## 本地开发

```bash
git clone https://github.com/klingai-dev/openclaw-plugin.git
cd openclaw-plugin
npm test
npm run pack:release
```

从本地 ZIP 安装：

```bash
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-openclaw-1.1.29.zip
```

兼容性和验收范围见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## License

[MIT](LICENSE)
