# 可灵 AI · OpenClaw

这是面向 OpenClaw 的可灵 AI 插件包。它通过原生声明式插件清单加载三个 Skills，并连接国内可灵远程 MCP `https://klingai.com/mcp/plugin/`；不启动本地 MCP Server，也不要求用户提供 API Key。

此接入方式已在 macOS、OpenClaw 2026.9.4 上完成以下验证：

- 插件能以原生 OpenClaw 插件识别并加载三个 Skills；
- OpenClaw Gateway 能加载 `kling-ai` 远程 MCP；
- OAuth 页面能由插件登录脚本自动打开，授权回调和凭据保存成功；
- `openclaw mcp doctor kling-ai --probe` 返回 `ok`；
- MCP 能发现图片、视频、素材上传、Element、动作库、额度及任务查询能力。

本包固定使用国内可灵账号和国内端点。不要同时注册海外端点，否则账号、额度和任务可能属于不同区域。

## 环境要求

- 已安装 OpenClaw 2026.9.4 或兼容版本，`openclaw` 命令可用；
- 从 Git 安装时需要 Git；当前真实环境验证平台为 macOS；
- 可在浏览器登录的国内可灵账号。

## 安装或更新插件

推荐直接从 ClawHub 安装：

```bash
openclaw plugins install clawhub:kling-ai-openclaw
```

开发分支也可以从 Git 安装，无需下载源码或切换目录：

```bash
openclaw plugins install git:github.com/klingai-dev/openclaw-plugin@main --force --accept-capabilities
```

Git 命令安装或覆盖更新到 `main` 当前版本。需要固定版本时，将 `main` 换成已发布的 tag 或完整提交 SHA。`--force` 确认信任此 Git 来源并允许覆盖已有安装，`--accept-capabilities` 接受插件声明的 Skills 和 MCP 能力。

安装生效方式以当前 OpenClaw 安装器的输出为准。最新官方文档支持应用到正在运行的本地 Gateway；OpenClaw 2026.9.4 从独立终端安装时可能提示手动执行 `openclaw gateway restart`。如果 Gateway 未启动，安装将在下次启动时生效。安装后开启新会话。

确认插件已加载：

```bash
openclaw plugins inspect kling-ai --json
openclaw gateway status
```

检查结果中应看到：

- `format` 为 `openclaw`；
- `enabled` 为 `true`；
- `status` 为 `loaded`；
- `mcpServers` 包含 `kling-ai`；
- `diagnostics` 为空。

## 配置可灵 MCP

插件清单已经声明远程地址、OAuth、超时和并发策略，安装后无需另写 MCP 配置。若需要修复或覆盖同名连接，可以使用 OpenClaw 原生命令：

```bash
openclaw mcp set kling-ai '{"url":"https://klingai.com/mcp/plugin/","transport":"streamable-http","auth":"oauth","headers":{"X-Kling-Integration":"Plugin-OpenClaw"},"supportsParallelToolCalls":false,"connectionTimeoutMs":30000,"requestTimeoutMs":60000}'
```

这条命令会让操作员配置覆盖插件默认值；它不会创建第二个可灵服务。若同名配置原先指向其他区域，请先确认没有仍需查询的任务，因为不同区域的任务通常不能互查。

## 登录可灵

在任意目录运行 OpenClaw 原生命令：

```bash
openclaw mcp login kling-ai
```

按终端提示打开本次授权链接，在浏览器完成可灵登录和授权，保持终端等待回调。OpenClaw 负责 OAuth 发现、PKCE、凭据保存及刷新，插件不读取或保存 token。成功后终端会显示：

```text
MCP OAuth credentials saved for "kling-ai".
```

授权链接、回调地址及端口以本次命令输出为准，不要复用旧链接。OpenClaw 2026.9.4 会打印链接，需要手动在浏览器打开；源码中另提供可选的自动打开浏览器脚本，见开发章节。

### 登录停在回调端口

若看到：

```text
listen EADDRINUSE: address already in use 127.0.0.1:8989
```

说明另一轮登录仍占用回调端口。先在旧终端按 `Ctrl+C`。如果找不到旧终端，检查监听者：

```bash
lsof -nP -iTCP:8989 -sTCP:LISTEN
```

确认结果确实是旧的 `openclaw` 或 `openclaw-mcp` 登录进程，再结束输出中的具体 PID：

```bash
kill -TERM <PID>
```

确认端口已经释放，然后重新执行 `openclaw mcp login kling-ai`。不要继续使用失败流程打印的旧授权链接；OAuth 的 state 和 PKCE challenge 属于那一次过期流程。

### 浏览器授权后没有返回终端

- 确认授权页和 OpenClaw 运行在同一台机器；回调地址是该机器的 `127.0.0.1`。
- 确认浏览器没有拦截跳转到 `http://127.0.0.1:8989/oauth/callback`。
- 不要把浏览器地址栏里的 `code`、`state` 或完整回调 URL 发给他人。
- 如页面只显示一次性授权码，可按 OpenClaw 的终端提示使用 `openclaw mcp login kling-ai --code <code>`，输入后不要把命令历史分享出去。

## 验证连接

完成授权后执行：

```bash
openclaw mcp status --verbose
openclaw mcp doctor kling-ai --probe
openclaw mcp probe kling-ai --json
```

预期结果：

- 状态显示 `streamable-http oauth`；
- 地址为 `https://klingai.com/mcp/plugin/`；
- doctor 显示 `kling-ai: ok`；
- probe 能列出可灵工具且 `diagnostics` 为空。

若连接清单尚未刷新，执行：

```bash
openclaw mcp reload
```

然后开启一个新的 OpenClaw 会话。旧会话可能保留更新前的工具清单或 Skill 上下文。

## 如何使用

安装并登录后，无需在终端直接调用 MCP 工具。在 OpenClaw 的新会话里用自然语言提出需求即可。插件会根据请求加载对应 Skill：

- `kling-ai-plugin`：账号、额度、素材上传、Element、动作库、任务状态和跨媒体流程；
- `kling-ai-generate-image`：文生图、图生图、编辑、重绘和受控变体；
- `kling-ai-generate-video`：文生视频、图生视频、动作控制和多镜头方案。

建议第一次先做只读检查：

```text
查看我的可灵账号、当前可用模型和剩余灵感值，不要提交生成任务。
```

确认账号和区域正确后再生成。插件会先展示本次模式、模型、尺寸或分辨率、时长、数量等最终参数，并说明任务会消耗可灵额度；只有你随后明确确认，才会提交一次收费任务。最初的生成需求不视为这次最终确认。失败、超时或结果不明确时，插件不会自动重复提交。请保留返回的任务编号 `generationId`，以后查询状态时使用同一个编号。

## 参考提示词

提示词越明确，模型越容易选择正确的生成模式、画幅和参数。推荐说明：用途、主体、动作、环境、构图或镜头、光线与材质、画幅、时长、分辨率，以及必须保留或禁止改变的内容。

### 文生图

```text
用可灵生成一张 4:5 的高端护肤品信息流海报。主体是一只磨砂白色精华瓶，放在浅灰石材台面中央，左后方有柔和日光形成细长阴影，背景是低饱和米灰渐变，构图留出顶部 25% 的文案安全区。突出玻璃、磨砂和液体折射质感，不要人物，不要生成文字。按商用成片质量生成 1 张。
```

### 图生图或受控编辑

先把参考图附到 OpenClaw 会话，再说：

```text
用这张图做图生图编辑。严格保留产品瓶型、标签布局、Logo、颜色和相机角度，只把背景改成深蓝色夜景展台，增加一圈冷白轮廓光和轻微水雾。不要改变瓶身比例，不要添加新文字，输出 4:5 商用广告图。
```

若附件可能有多种用途，请明确它是“待编辑源图”“身份或产品参考”“风格参考”还是视频“首帧”。

### 文生视频

```text
用可灵生成一条 10 秒、16:9、1080p 的电影感咖啡广告。开场是清晨窗边的手冲咖啡特写，蒸汽缓慢上升；镜头平稳向前推进，3 秒后焦点从咖啡粉转移到落下的水流，最后停在琥珀色咖啡液的微距画面。暖色自然光，真实材质，动作连续，不要字幕，不要额外人物。
```

### 图生视频

先附图，再明确素材角色：

```text
把这张图片作为视频首帧生成 5 秒、9:16 的短视频。保持人物身份、服装和背景结构不变；人物轻轻抬头看向镜头，头发被微风吹动，镜头缓慢推近，背景灯光有轻微视差。动作自然克制，不改变脸型，不增加其他人物，不添加文字。
```

### 产品展示视频

```text
用附图中的鞋作为产品参考，生成 10 秒、16:9、1080p 产品展示视频。必须保持鞋面结构、Logo 位置、配色和鞋底纹理准确。镜头先做半圈环绕，再切到鞋底缓慢抬起的细节特写，背景是深灰摄影棚，硬朗侧光，地面有轻微反射。不要添加脚或模特，不要改变产品设计。
```

### 动作控制

```text
先列出当前可用的动作库，不要生成。找到适合“自然挥手”的动作后，把我附加的主体图作为主体参考生成动作控制视频。保持人物身份和服装一致，使用选定动作，背景不变；提交前如果实时模型需要我选择时长或分辨率，再询问我。
```

### 查询任务

```text
查询任务编号 <generationId> 的当前状态，只查询，不要重新提交。成功后返回主要作品；仍在处理中就告诉我当前状态。
```

### Element 管理

```text
列出我的可灵 Element，只读取，不要创建或删除。
```

```text
把这张图片创建为一个名叫“红发侦探”的人物 Element，描述为“成年女性，红色短发，深棕风衣”。创建前如缺少实时工具要求的字段，再询问我。
```

## 使用原则

- 生成请求会消耗可灵额度；每次提交前必须展示最终参数并取得明确确认，确认后只提交一次。
- 工具和模型参数以本次账号返回的实时 schema 为准，README 示例不固定模型名称。
- 任务被受理不代表作品完成；只有任务终态成功且包含可用主媒体时才算完成。
- 图片或视频结果链接可能是临时链接，重要结果应及时下载保存。
- 查询已有任务不会创建新任务；编辑结果、制作变体或把图片继续做成视频属于新的生成任务。
- 不在聊天、日志、README 或提交记录中保存 API Key、token、Cookie、授权头、授权码或带签名的结果 URL。

## 退出或切换账号

清除当前 OpenClaw 保存的可灵 OAuth 凭据：

```bash
openclaw mcp logout kling-ai
```

切换账号时先退出，再运行 `openclaw mcp login kling-ai`。切换区域时还必须修改 MCP 地址并重新授权；不要期待国内和海外账号能够互查任务。

## 开发、测试和打包

以下命令仅用于开发，需要 Git、Node.js/npm 和 Python 3.9+；普通用户安装和登录无需运行。

```bash
git clone https://github.com/klingai-dev/openclaw-plugin.git
cd openclaw-plugin
npm run check
npm test
npm run pack:release
```

发布 ZIP 写入 `dist/`，不包含凭据、`node_modules` 或本地 MCP runtime：

```bash
openclaw plugins install --force --accept-capabilities ./dist/kling-ai-openclaw-1.1.14.zip
openclaw plugins inspect kling-ai --json
```

在源码目录运行 `npm run login` 也会调用官方 `openclaw mcp login kling-ai`。如需自动打开浏览器，可选运行 `python3 scripts/login.py`；这个辅助脚本仍由 OpenClaw 完成授权及凭据管理，不是安装或登录的必需依赖。

三个 Skills 改编自仓库 `workbuddy/workbuddy`，保留单次提交、任务 ID、结果判定和 MCP App 刷新所有权规则。OpenClaw 专属配置及未覆盖的生产验收项见 [兼容性说明](docs/COMPATIBILITY.md)。

参考文档：[OpenClaw 插件安装](https://docs.openclaw.ai/cli/plugins/install)、[OpenClaw 原生清单](https://docs.openclaw.ai/plugins/manifest)、[OpenClaw MCP OAuth](https://docs.openclaw.ai/cli/mcp/transports)。
