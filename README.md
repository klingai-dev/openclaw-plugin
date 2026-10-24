# Kling AI for OpenClaw

在 OpenClaw 里使用可灵 AI 生成图片和视频。

插件通过 OAuth 连接可灵官方远程 MCP，不需要 API Key，也不会在本地启动 MCP Server。

## 功能

- 文生图、图生图、图片编辑和变体
- V4 / V4 Flash 视频、文生视频、图生视频、全能参考、关键帧、动作控制和多镜头视频（以当前账号实时能力为准）
- 上传参考素材，管理 Element 和动作库
- 查询账号、额度、任务状态和生成结果
- 提交生成任务前展示最终参数和额度提示，确认后只提交一次

## V4 支持

推荐使用 V4。插件会同时检查传统视频入口和 `omni_ref_video`，包括无附件的纯文本请求；只选择当前账号返回且满足需求的工具/模型配对。图片、视频、音频、主体和首尾帧的支持范围、组合上限及计费以实时模型定义为准。V4 Flash 用于速度或成本优先的请求；明确指定 V4 时不会静默降级。

[国内 ClawHub 页面](https://clawhub.ai/klingai-dev/plugins/kling-ai-openclaw)。

## 安装

需要 OpenClaw `2026.9.4` 或兼容版本。

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

## 开启交互 UI（MCP Apps）

插件安装本身不会开启 OpenClaw 的全局 MCP Apps 开关。要在 Control UI 显示可灵交互卡片，安装后执行：

```bash
openclaw config set mcp.apps.enabled true --strict-json
openclaw gateway restart
openclaw config get mcp.apps.enabled
```

该开关允许已配置 MCP 服务提供交互 HTML，重启会短暂中断 Gateway。返回 `true` 只证明配置已开启，仍需在页面验证 App 实际显示。可让 Agent 按本包 Skill 完成检查与设置；安装或发现 Skill 不会自动执行这些命令。

通过反向代理访问时，App 还需要独立来源与沙箱端口代理：默认 Gateway 为 `18789`，App 为 `18790`。按[官方 MCP Apps 配置](https://docs.openclaw.ai/cli/mcp/apps)设置 `mcp.apps.sandboxOrigin`，不要把 App 与 Control UI 配成同源。消息渠道不保证内嵌 UI。

旧版宿主可先运行 `openclaw update`，再用 `openclaw --version` 核对。2026-10-24 查阅的当前稳定版为 [2026.10.6](https://github.com/openclaw/openclaw/releases/tag/v2026.10.6)；该版要求 Node 24.22.1+ 或 26.12.1+，遵循官方更新器提示。本包最低兼容基线仍为 2026.9.4，尚未完成 2026.10.6 真实 UI 验收，不保证升级即可修复。

只有原始工具文本时，检查开关、代理和会话调用路径；MCP 探测成功不等于 UI 已挂载。已提交任务保留任务编号，不要为了修 UI 重新生成。

## 登录

首次使用时先把国内 MCP 注册到 OpenClaw。OpenClaw 2026.9.4 的 `mcp login` 从操作员管理的 MCP 配置中读取登录目标：

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

按终端提示在浏览器完成可灵登录和授权。凭据由 OpenClaw 保存和刷新，插件不会读取或保存 token。

需要自动打开浏览器时，在已安装插件的目录运行：

```bash
npm run login
```

包内登录助手会调用同一个 OpenClaw 登录流程，并自动打开国内可灵授权页；授权回调和凭据仍由 OpenClaw 管理。直接运行 `openclaw mcp login kling-ai` 时，宿主只打印授权网址；网址是否可点击、是否显示下划线由终端决定。自动打开失败时，按提示改用原生命令并复制链接到浏览器。


确认连接：

```bash
openclaw mcp doctor kling-ai --probe
```

正常情况下会返回 `kling-ai: ok`。

## 使用

安装并登录后，直接在 OpenClaw 会话里描述需求。

生成图片：

```text
用可灵生成一张 4:5 的护肤品广告图：磨砂白色精华瓶放在浅灰石材台面上，
柔和侧光，顶部留出标题区域，不要人物，不要生成文字。
```

生成视频：

```text
用可灵生成一条 10 秒、16:9、1080p 的咖啡广告。
镜头从手冲咖啡特写缓慢推进，暖色自然光，不要字幕。
```

使用参考图时，请说明图片的用途：

```text
把这张图作为视频首帧，生成 5 秒、9:16 的短视频。
保持人物、服装和背景不变，只让人物轻轻抬头，镜头缓慢推近。
```

提交前，插件会列出模型、尺寸或分辨率、时长、数量等最终参数，并说明会消耗可灵额度。收到明确确认后才会创建任务。

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

国内和海外账号的额度及任务不互通。切换账号时先退出，再重新登录：

```bash
openclaw mcp logout kling-ai
openclaw mcp login kling-ai
```

## 名称与下划线

OpenClaw 的 MCP 注册名与代码模式调用名不同：注册名可以保留 `kling-ai__text_to_image`，代码模式会把不合法的 JavaScript 标识符字符转换为下划线，例如服务标识可能显示为 `kling_ai`。调用时以当前会话的工具或命名空间声明为准，不要固定拼接前缀。

这个转换不适用于安装和配置：MCP 服务键仍为 `kling-ai`，插件 ID、Skill 名和包名保持本包原有拼写。不要把 `openclaw mcp login kling-ai` 改成下划线形式。

依据：[MCP 工具命名](https://docs.openclaw.ai/plugins/bundles#tool-naming)、[代码模式命名](https://docs.openclaw.ai/tools/code-mode/tool-surface)。

## 常用排查

```bash
openclaw plugins inspect kling-ai --json
openclaw mcp status --verbose
openclaw mcp doctor kling-ai --probe
```

如果工具列表没有刷新：

```bash
openclaw mcp reload
```

如果 `mcp login` 报错 `No MCP server named "kling-ai"`，先执行[登录](#登录)中的注册命令，再重新登录。

然后开启新会话。任务提交超时或结果不明确时，不要直接重试；保留 `generationId` 或 `taskTraceId` 后查询原任务。

## 本地开发

```bash
git clone https://github.com/klingai-dev/openclaw-plugin.git
cd openclaw-plugin
npm test
npm run pack:release
```

从本地 ZIP 安装：

```bash
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-openclaw-1.1.21.zip
```

兼容性和验收范围见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## License

[MIT](LICENSE)
