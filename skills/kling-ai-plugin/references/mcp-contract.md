# 可灵 MCP 输入输出契约

本文件用于核对工具面和参数结构，不把动态模型配置写死。每次操作均按以下顺序读取事实：

1. 当前连接的 `tools/list` 决定实际可调用的工具、工具说明和 `inputSchema`。
2. `who_am_i.availableModels` 决定每个生成工具的模型、模型参数、必填项、默认值、枚举值、数量限制和素材输入。
3. 实际工具响应决定新增输出字段。没有 `outputSchema` 或真实响应时，不猜字段。

## 工具全集

- 发现与账户：`who_am_i`、`query_membership_and_credits`、`logout`
- 生成与查询：`text_to_image`、`image_to_image`、`text_to_video`、`image_to_video`、`motion_control`、`query_tasks`，以及实时工具面可选的 `query_result`
- 素材与复用：`file_upload`、`motion_library_list`、`element_create`、`element_list`、`element_get`、`element_update`、`element_delete`

只有当前 `tools/list` 中真实存在的工具才可调用。不同区域或账号等级的工具、模型和值域可能不同，不得假设与国际端完全一致。

## 固定工具级输入

- 五个生成工具：`model`、`arguments[]`、`inputs[]`、`rationale`、`taskTraceId`。
  - `model` 必须来自该工具当次 `who_am_i` 清单，不使用猜测的默认模型。
  - `arguments[]` 每项为 `{name, value}`，所有 `value` 均为字符串；名称、必填、默认值、枚举和 `maxItems` 以所选模型为准。
  - `inputs[]` 每项为 `{name, inputType, url}`；只传所选模型声明的输入名，`inputType` 使用实时 schema 声明的值。
  - `rationale` 说明用户目标和选参理由，不代替用户提示词。
- `query_tasks`：`generationId` 必填，`taskTraceId` 选填。
- `query_result`：若实时工具面存在，使用同一任务标识把已有任务挂载为 Generation Widget；只用于一次性展示，不用于 Widget 内部刷新。
- `file_upload`：`filename`、`contentType`、`size`、`taskTraceId` 均按实时 schema 传入。
- `who_am_i`、`query_membership_and_credits`、`logout`、`motion_library_list`、`element_list`：仅有可选 `taskTraceId`。
- `element_get`、`element_delete`：`id` 和可选 `taskTraceId`；调用前按工具说明检查实际必填规则。
- `element_create`：`name`、`description`、`resource`、`tags`、`taskTraceId`。
- `element_update`：在 create 字段基础上增加 `id`。先 `element_get`，再按完整对象更新，避免缺失字段被清空。

`taskTraceId` 使用 RFC 4122 UUIDv7。同一用户目标的发现、上传、生成、明确重试和查询复用同一个值；用户切换到无关目标时创建新值。每次生成仍以独立 `generationId` 标识。结果不明确时保留原值，但除非实时工具明确保证幂等重放，否则不得用它重放生成调用。

## 动态模型参数

提交生成前必须调用 `who_am_i`，按目标工具与模型逐项读取：

- `arguments[]`：`name`、`required`、`default`、`allowedValues` / `allowed_values`、`maxItems` 和 `description`；
- `inputs[]`：`name`、`required` 和 `description`；
- 模型别名只用于理解用户意图，提交时只传规范 `model` 名称。

当前区域的完整模型名、参数、默认值、枚举、数量上限和 inputs 见[模型参数快照](model-parameters.md)。只在核对或排障时读取；实际调用仍以当次 `who_am_i` 为准。

当工具说明与 `who_am_i` 冲突时，采用更严格的工具级限制并停止不安全提交。当前必须保留的门禁包括：

- `text_to_image` 和 `text_to_video` 不使用 Element，不传 `elements` 或 `<<<id>>>`；
- Element 先 `element_get`，图片 Element 只交给实时 schema 明确支持 `elements` 的 `image_to_image` / `image_to_video`；视频 Element 只交给实时 schema 明确支持的 `image_to_video` 模型；
- `motion_control` 必须有主体 `image`，并在动作库 `motionId` 与动作来源 `video` 中二选一；其余方向、分辨率和声音参数从实时模型 schema 获取；
- 某模型要求素材 URL 来自 `file_upload` 时，不得直接传本地路径或任意外链；
- 不得传实时模型未声明的参数、输入名或枚举值。

## Element 资源

- 图片 Element：`resource.cover` 加 1–3 个 `resource.secondary[{name,inputType,url}]`，不与 `resource.video` 同传。
- 视频 Element：`resource.video`，可按实时工具说明附带 `resource.voice`；不与 `cover` / `secondary` 同传。
- `tags` 至少一个，并且只能使用实时工具说明给出的标签。
- `element_delete` 会删除用户素材，必须在调用前获得明确确认。
- 图片 Element 的主图无法通过普通更新安全替换时，应先说明需要删除并重建，再等待用户确认。

## 已知输出

- 生成提交：`generationId`、`status`，可能含 `creditsConsumed` 和 `message`。这个即时响应只证明提交受理或任务创建；`creditsConsumed` 和非终态 `status` 都不能证明作品完成。
- `query_tasks`：`generationId`、`status`、`createTime`、`finishTime`、`works[]`；作品可能含 `status`、`contentType`、`url`、`urlWithoutWatermark`、`coverUrl`、`coverUrlWithoutWatermark`。状态按大小写不敏感处理，并以实时响应判断终态。只有任务终态成功且至少一个作品带可用 `urlWithoutWatermark` 或 `url`，才可声称作品完成；作品级 `status` 存在时必须为成功，缺失时不得凭空判定失败。封面 URL 只作封面回落，不是视频成功证据。
- 终态成功但没有可用作品属于输出不一致：按原样报告并保留 `generationId` / `taskTraceId`，不要自动提交替代任务。
- 提交响应丢失且没有 `generationId` 时，`query_tasks` 不能仅凭 `taskTraceId` 定位任务。只有实时工具明确提供任务列表或追踪查询时才使用；不得把“无法查询”解释为“任务未创建”。
- `file_upload` 第一步：`ticket`、`uploadUrl`、`expireAt`；随后向 `uploadUrl` 发送包含 `ticket` 和文件字节的 multipart 请求，并读取上传响应中的 URL。
- `file_upload` 用于两步完成本地文件上传：MCP 调用先返回一次性上传凭证与地址，随后调用方完成 multipart 文件字节上传。工具定义和 MCP 结果均不得携带 `_meta.ui`、`ui/resourceUri` 或 output template，避免宿主为这个非可视流程预留空 Upload Widget；需要用户操作的可视化上传应使用独立展示工具。
- `query_membership_and_credits`：`userId`、`membershipType`、`availableRemainCredits`。
- `motion_library_list`：`motions[{id,name,motionUrl,coverUrl,duration,hasAudio}]`，`duration` 单位为毫秒。
- `element_list`：`elements[{id,name}]`。
- `element_get`：`id`、`name`、`description`、`resource`、`tags`。
- `motion_control`：普通生成提交结果；已挂载 widget 时由 widget 内部调用 `query_tasks`，未挂载时仅在用户之后明确查询时调用一次。
- `element_create`：工具说明保证返回 Element `id`。

`element_update`、`element_delete` 和 `logout` 当前没有可依赖的公开完整 `outputSchema`。读取真实返回并按原样处理，不声称存在未声明字段。如果发布要求机器校验全部成功输出，需要服务端补充 `outputSchema` 或提供脱敏成功 fixture。

## MCP App widget 契约

- 需要 UI 的生成工具通过首选 `_meta.ui.resourceUri` 关联稳定的 `ui://` 资源；为兼容旧宿主，服务端也可以同时提供 `_meta["ui/resourceUri"]`。
- UI resource 使用 `text/html;profile=mcp-app`，并由远端 Kling MCP 通过 `resources/list` / `resources/read` 提供。Connector 包不复制 HTML。
- 工具结果保留文本 `content` 回落，并提供 widget 渲染所需的结构化结果。没有 UI 能力的宿主仍可读懂同一次调用。
- `element_list` 是纯数据查询：工具定义和结果都不带 `_meta.ui`、`ui/resourceUri` 或 vendor output template；主体列表由模型读取，不能为它预留空 Widget。需要可视化主体库时使用独立展示工具。
- OpenClaw 挂载 widget 后，将工具输入与结果传给该组件，并允许组件通过标准 MCP Apps bridge 调用 `query_tasks`。这张 widget 是唯一刷新所有者和媒体预览。
- 模型不得为已挂载 widget 的同一提交调用 `query_tasks` 或 `query_result`。用户之后明确展示已有任务时优先调用实时存在的 `query_result` 一次；没有该工具时才调用一次 `query_tasks` 返回无 UI 快照。
- 未挂载 widget 的模型只返回同次提交结果或用户明确要求的一次查询快照；非终态快照不得触发轮询循环，也不得被描述为作品完成。
