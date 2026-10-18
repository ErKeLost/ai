# 第 6 章：Session——JSONL、分支与上下文投影

## 学习目标

理解 Pi 为什么使用 append-only JSONL 和 parent ID 组织会话，如何从树中选出 active branch，以及原始历史与模型可见 context 有何不同。

## 1. Session 是事件树，不是聊天数组

每条 session entry 都有 `id`、`parentId`、时间戳和具体类型。文件按行追加 entry；当前 leaf 表示活跃分支终点。继续旧消息会从那个节点派生另一条分支，不必复制整份文件。

```text
header
u1 → a1 → u2 → a2
          └→ u2b → a2b   ← 继续旧节点后形成的新分支
```

例如用户回到 `u2` 后重新提问，旧的 `a2` 仍留在文件，但 active branch 可能变成 `u2 → u2b → a2b`。历史保留便于 `/tree`、fork 和恢复。

## 2. JSONL 的 entry 种类

会话头记录 id/cwd/version；message entry 保存 AgentMessage。状态类 entry 包括 model_change、thinking_level_change、usage、session_info、label、custom。改变模型上下文结构的 entry 包括 compaction、branch_summary、context_edit 和 custom_message。

```json
{"type":"message","id":"u1","parentId":null,"message":{"role":"user","content":"你好"}}
{"type":"message","id":"a1","parentId":"u1","message":{"role":"assistant","content":[{"type":"text","text":"你好"}]}}
```

简化的例子省略时间戳、session header 和 message 的其他必需字段。完整字段定义见 [session-format.md](../../pi/packages/coding-agent/docs/session-format.md)。

## 3. 从树重建模型上下文

SessionManager 找到 active leaf，向根回溯得到路径，再把状态记录投影成当前模型选择/思考级别和 AgentMessage 序列。`buildSessionProjection()` 不等于“读所有 JSONL 行”：另一分支、仅 UI 的 custom entry、已通过 context_edit 移除的内容都不会照搬进本次 LLM 请求。

```text
全部 JSONL rows
    → 通过 parentId 得到 leaf path
    → 应用 context edits / compaction 边界
    → 生成 AgentMessage[]
    → convertToLlm()
    → provider messages
```

例：一条 `custom` extension entry 用来记“用户 pinned 了这个工具”，它可供扩展恢复状态，但不进入 LLM context。`custom_message` 则能以 user 内容注入 context。

## 4. 追加优于就地改写

Append-only 文件让崩溃恢复和审计更简单：如果 context 需要忽略一条消息，写一个 `context_edit` 指向它，而不是静默改旧行。fork、新分支、压缩等操作也可作为新 entry 表达。

代价是读取时要重放和投影；文件会持续增长。Pi 通过 session 索引、分支导航、compaction 和 export 处理这些问题，通常不需要破坏原始 transcript。

## 5. Session API 与源码

- 数据结构和读写：[session-manager.ts](../../pi/packages/coding-agent/src/core/session-manager.ts)
- AgentSession 与持久化事件协调：[agent-session.ts](../../pi/packages/coding-agent/src/core/agent-session.ts)
- 数据格式：[session-format.md](../../pi/packages/coding-agent/docs/session-format.md)
- 用户操作：[sessions.md](../../pi/packages/coding-agent/docs/sessions.md)
- 消息类型：[message-types.md](../../pi/packages/coding-agent/docs/message-types.md)

练习：在 session-manager 中找到 `buildSessionProjection` 和 `getBranch`，想象两个 child 指向同一个 parent 时哪个决定“当前上下文”，再找代码里 leaf 是怎样保存/更新的。

