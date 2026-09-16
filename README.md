# Kling AI for OpenClaw

在 OpenClaw 里使用可灵 AI 生成图片和视频。

插件通过 OAuth 连接可灵官方远程 MCP，不需要 API Key，也不会在本地启动 MCP Server。

## 功能

- 文生图、图生图、图片编辑和变体
- 文生视频、图生视频、动作控制和多镜头视频
- 上传参考素材，管理 Element 和动作库
- 查询账号、额度、任务状态和生成结果
- 提交生成任务前展示最终参数和额度提示，确认后只提交一次

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

## 登录

首次使用时先把国内 MCP 注册到 OpenClaw。OpenClaw 2026.9.4 的 `mcp login` 从操作员管理的 MCP 配置中读取登录目标：

```bash
openclaw mcp add kling-ai \
  --url https://klingai.com/mcp/plugin/ \
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
https://klingai.com/mcp/plugin/
```

国内和海外账号的额度及任务不互通。切换账号时先退出，再重新登录：

```bash
openclaw mcp logout kling-ai
openclaw mcp login kling-ai
```

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
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-openclaw-1.1.16.zip
```

兼容性和验收范围见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## License

[MIT](LICENSE)
