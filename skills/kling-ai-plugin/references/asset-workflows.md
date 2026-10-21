# 主体库、动作库与素材上传

以实时工具和模型定义为准，素材管理与生成分开授权。

## Element 主体库

- 浏览使用 `element_list`，展示真实 ID 和名称；名称歧义时让用户选择。复用或更新前调用 `element_get`，不能猜 ID 或资源类型。
- 仅用户明确要求保存可复用主体时调用 `element_create`；普通参考图生成不自动建主体。收集名称、描述、标签及完整资源，按[MCP 契约](mcp-contract.md)验证。
- 更新前读取完整对象，将指定变更合并到 `name`、`description`、`resource`、`tags`，保留未修改字段及图片封面。`secondary[]` 是整体替换，保留未改副图并遵守实时数量限制。
- 不静默转换图片/视频主体。若改封面需删除重建，先解释 ID 会变并获明确授权；删除仅在用户明确指定主体后进行。

## 生成中使用主体

1. 已知 ID 先 `element_get`；仅有名称则先列表、消歧再读取。
2. 检查账号可访问及资源真实类型，不能用视频封面冒充视频或图片主体。
3. 所选模型须声明该资源类型和绑定参数，包括全能参考；按[模型参数](model-parameters.md)检查 `elementSupport` 和条件总上限。
4. 使用真实 ID 和该模型的提示词/结构化绑定语法。只有模型明确声明 `<<<ELEMENT_ID>>>` 和 `elements` JSON 数组字符串时，才采用该格式，不沿用其他模型字段。
5. Element 不能代替必填 `image_1`、`first_image` 或动作控制的主体 `image`。
6. 按[图片 Skill](../../kling-ai-generate-image/SKILL.md)或[视频 Skill](../../kling-ai-generate-video/SKILL.md)完成生成确认及单次提交。

## 动作库

- 使用 `motion_library_list` 展示真实名称、ID、时长和音频信息；毫秒除以 1000 可显示秒。空列表不编造动作。
- 名称歧义时让用户选择。浏览动作库不调用 `motion_control`；未暴露的动作创建、更新、删除能力不臆造，也不用 Element 工具管理动作。
- 动作控制要求主体 `image`；来源只能是 `motionId` 或 `video` 之一，不能同时传入，预览 URL 不能作 ID。
- 调用 `who_am_i` 并按所选模型定义设置 `motionDirection`、`resolution`、`keepOriginalSound`。`image_direction` 遵守实时来源时长约束，不把动作时长传入未声明的 `duration`。

## 上传

- 优先使用对话附件中模型接受的引用。实时工具接受公开 URL 时直接使用，无需下载；历史生成结果复用前通过原 `generationId` 刷新，不复用旧签名 URL。
- 无可用引用且暴露 `file_upload` 时，以真实文件名、MIME、字节大小和同一 `taskTraceId` 获取票据，本地路径不能充当远端 URL。
- 按返回契约完成第二步上传：multipart 表单包含 `ticket` 和二进制 `file`。票据不等于上传成功，服务确认后才使用媒体 URL。
- 票据单次使用并按 `expireAt` 过期；不显示或记录票据、签名上传 URL 或凭据。
- 宿主不能读取文件或工具不支持上传时，说明限制并要求可用附件，不提交依赖缺失素材的生成或主体写入，不循环请求票据。
