# MCP 输入输出契约

模型、默认值、枚举、必填字段、素材数量及组合以当前 `tools/list` 和 `who_am_i` 为准。先读[能力发现](capability-discovery.md)与[模型参数](model-parameters.md)。

## 工具组

- 发现与账号：`who_am_i`、`query_membership_and_credits`、`logout`。
- 生成与状态：`text_to_image`、`image_to_image`、`text_to_video`、`image_to_video`、`omni_ref_video`、`motion_control`、`query_tasks`。
- 素材与复用：`file_upload`、`motion_library_list`、`element_create`、`element_list`、`element_get`、`element_update`、`element_delete`。

只调用当前实际暴露的工具，不凭列表推断已连接。

## 请求

- 常见顶层字段为 `model`、`arguments[]`、`inputs[]`、`rationale`、`taskTraceId`，实际结构与编码服从实时 `inputSchema`。
- `model` 必须是所选工具在 `who_am_i` 中返回的规范名。
- `arguments[]` 项为 `{name,value}`；按工具要求把值编码为字符串，仅使用模型声明的字段。
- `inputs[]` 项为 `{name,inputType,url}`，槽名及类型以实时定义为准，本地媒体先上传。
- `rationale` 解释目标与参数选择，不能代替提示词。`taskTraceId` 使用 UUIDv7，同一目标复用，无关目标新建。
- 模型能力与请求结构必须同时满足；冲突时刷新并在无法满足时停止，不靠示例扩大能力。

## 稳定约束

- Element 支持由所选模型声明的绑定参数及资源类型决定，不按入口名一律禁止或允许。使用前 `element_get`，检查 `elementSupport`、必填素材、单项和组合上限及参考视频条件。
- 图片主体的封面与副图遵循工具允许的数量，不能混入视频；视频主体仅在工具允许时附声音，不混入图片封面或副图。
- 标签只能使用声明值。更新前读取并提交合并后的完整对象，删除或删除重建须明确授权。
- 动作控制需要主体图片及 `motionId` / 源视频二选一。
- 要求 `file_upload` 来源时不得直接传本地路径或任意外链。不能传未声明字段或枚举。

## 响应

提交通常返回 `generationId`、`status`，可能包含 `creditsConsumed`；这些不能单独证明成品完成。查询按实时响应解释状态、时间及 `works[]` 的主媒体与封面，结果展示遵循[任务生命周期](tool-workflows.md)。签名 URL 可能过期，不记录或当永久标识。无公开输出 schema 时使用实际返回，不发明字段或成功状态。
