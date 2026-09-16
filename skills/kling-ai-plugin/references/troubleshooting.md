# OpenClaw 故障排查

## 缺少工具或未授权

由操作者按包根 README 使用 `openclaw mcp add` 配置唯一的 `kling-ai` 服务，再执行 `openclaw mcp login kling-ai`。OpenClaw 2026.9.4 的 `mcp login` 从操作员管理的 MCP 配置读取目标；插件清单中的同名服务仍用于 Agent Runtime。使用 `openclaw plugins inspect kling-ai` 检查 Bundle，再用 `openclaw mcp doctor kling-ai --probe` 检查已保存的连接。不要请求 API key、token、cookie 或完整授权头。

当前本机 OpenClaw 2026.9.4 使用 `OpenClaw MCP` 作为动态注册 client_name。若服务端拒绝注册或回调，报告脱敏错误；不要编造 client_id、oauth_resource、scope 或另建授权代理。

## 任务与结果

提交超时不等于失败，禁止自动重放。已有 generationId 时按用户请求查询一次；没有编号且实时工具无法定位时报告未知并保留 taskTraceId。积分不足、限流或提供方失败时停止，不自动重提。

App 已挂载时由 App 刷新，模型不重复查询；没有 App 时返回文本回落和至多一个主结果链接。不要把视频封面当成视频，不把受理状态当成完成。历史素材链接可能过期，按实时工具契约刷新已有任务结果；无法恢复时要求重新提供素材。

## 素材输入

只使用当前模型接受的素材引用。只有实时上传工具及宿主实际支持文件读取和上传时，才执行上传；本地路径不能冒充远程图片 URL。参数和模型值以实时 schema 为准。
