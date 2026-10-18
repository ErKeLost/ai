# 第 7 章：Compaction——压缩上下文而不抹掉历史

## 学习目标

理解 context window 为什么会满、自动压缩如何选 cut point、summary 如何进入后续请求，以及压缩与分支摘要为什么是两种不同功能。

## 1. 先区分“历史”与“本次请求”

模型有输入窗口限制。会话历史可比单次请求长很多；Pi 需要将旧消息折叠成摘要，同时保留近期对话。Compaction 修改模型可见投影，不会删除原 JSONL entry。

```text
持久历史：u1 a1 tool1 u2 a2 tool2 u3 a3 ...
压缩后请求：system + summary(u1..a2/tool2) + u3 a3 ...
```

例：用户刚刚说“最终 JSON 字段必须叫 `timeoutMs`”。如果这条指令属于保留的近期区间，它会原样保留；更旧的探索过程可能只保留为 summary。

## 2. 触发和切点

Pi 根据估算 token 数、模型 context window 和 reserve space 触发自动压缩；用户也可执行 `/compact`。算法从较新的记录向回走，直到满足近期消息预算，再在适当边界找 cut point。普通情况尊重 user-message span；单个 span 自己就过长时，可能在中间的 assistant 边界切开并分别摘要。

压缩也可能用于处理 provider 的 context overflow，或“模型因为输出长度限制未完成”的恢复流程。自动压缩不是通用总结按钮，而是 agent 调度和上下文预算管理的一部分。

## 3. 写入 CompactionEntry

生成 summary 后追加 `CompactionEntry`，包括摘要文本、`firstKeptEntryId`、压缩前 tokens 等。Session projection 再把 summary 放在 system 后面，并从 kept boundary 接续消息。

```text
旧 path: u1 → a1 → u2 → a2 → u3 → a3
新 entry: cmp(summary=u1..a2, firstKeptEntryId=u3)
LLM: system + compactionSummary + u3 + a3
```

source of truth 仍是原树；`cmp` 只是后续分支的上下文规则。再次 compaction 时，Pi 会沿上一次 kept boundary 计算增量，避免漏掉此前保留下来的内容。

## 4. 分支摘要不是 compaction

当用户通过 tree navigation 切换分支，Pi 可以把离开的支线浓缩成 branch summary，便于模型知道之前尝试过什么。当前活跃主线仍按自己的消息继续。Compaction 是限制请求长度；branch summary 是跨分支带回有用信息。

例：支线 A 尝试“升级依赖”，失败因为上游 API 不兼容；切回主线 B 后，摘要应带回“升级失败与原因”，但不应该把整个支线 transcript 当成当前分支的一串新用户对话。

## 5. 自定义压缩 hooks

扩展可在 `session_before_compact` 提供自己的摘要或 veto/failure 行为；Pi 同时暴露压缩失败事件与 tree 相关 hook。扩展可以从 transcript 派生文件追踪表、结构化计划或 artifact index，但应保留模型必须记住的约束，而不只是改写语句。

## 6. 源码和进一步阅读

- [compaction.ts](../../pi/packages/coding-agent/src/core/compaction/compaction.ts)：阈值、cut point、prompt 和 entry 创建。
- [branch-summarization.ts](../../pi/packages/coding-agent/src/core/compaction/branch-summarization.ts)：分支摘要。
- [utils.ts](../../pi/packages/coding-agent/src/core/compaction/utils.ts)：消息处理、token 估算、文件追踪。
- [compaction.md](../../pi/packages/coding-agent/docs/compaction.md)：完整状态/边界说明。

练习：找 `firstKeptEntryId` 的写入点，想象下一次压缩发生时 `u3` 为什么必须被纳入“仍保留的上下文”或“新摘要”的某一边，不能在两边都消失。

