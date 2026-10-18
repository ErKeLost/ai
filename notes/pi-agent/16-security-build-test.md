# 第 16 章：安全边界、构建与源码验证

## 学习目标

形成对 Pi 权限模型的准确认识，知道项目 trust、tool allowlist、Codemode sandbox 和系统级 sandbox 的区别；最后能够安全地安装、检查和继续读源码。

## 1. 项目 trust 不是权限隔离

Pi 明确不内置完整 filesystem/process/network/credential 权限系统。Pi 和 extension 默认继承启动进程的操作系统权限。Project trust 决定是否加载项目里的可执行/提示资源，不会把 bash 命令限制在 cwd，也不会阻止 extension 访问环境变量。

```text
project trust → 是否读取/加载 project resources
tool loadout  → 模型可以请求哪些工具
OS/container  → 实际进程能访问哪些文件、网络和进程
```

例：`--tools read` 限制模型收到的工具列表，但如果某个已注册 extension tool 内部可以联网或写文件，那仍可能被模型间接调用。真正的边界应在容器、VM、操作系统用户和网络策略层设置。

陌生 repo 的 extension 可以运行任意 Node 代码；skill 也是模型会遵循的指令。使用前检查文件和 package dependency，尤其是自动化、MCP server、远程 SSH 环境。

## 2. Codemode 的 sandbox 也有限定范围

QuickJS sandbox 没有一般 Node 能力，只能调用注入的 tools；这是脚本执行能力的限制。若注入工具可执行任意 bash，那么脚本仍可通过它触达 bash 权限。应把“脚本不能直接 `process`”和“工具能做什么”分开审计。

例：只注入 `lookupIssue({id})` 时，脚本无法自行读取磁盘；改为注入 `bash({command})` 后，它便通过宿主代理获得 shell 能力。

## 3. 依赖安装与构建

Pi 对直接依赖精确 pin，并将 package-lock 作为依赖事实来源；项目推荐安装时使用 `--ignore-scripts`。Node 最低版本在 checkout README 中声明。不要为了读文档执行安装脚本或发布流程。

```bash
cd pi
npm install --ignore-scripts
npm run check
./test.sh
```

`npm run check` 会检查格式、类型、导入边界、生成安装锁和 smoke 条件；`./test.sh` 跑项目测试。依项目约定，不要直接对全 monorepo 随意跑 vitest 全套，因为配置的真实 endpoint/auth env 可能激活 e2e 测试；修改单个包时运行目标测试。

本次学习材料只修改根仓库 `notes/pi-agent/`，不改 Pi package 源码，因此不需要重建或运行 Pi 的测试套件；我们会校验文档链接与每章示例结构。

## 4. 如何严谨地阅读一段源码

给每个行为找到四项证据：

1. 入口：谁调用它？
2. contract：输入/输出类型和错误状态是什么？
3. tests：哪条用例证明具体时序/边界？
4. consumer：谁依赖此行为，修改会影响什么？

例：想改 tool result 输出长度，入口在 tool execution；contract 在 AgentTool result；边界测试在 coding-agent tool tests；consumer 包括 LLM 上下文、TUI renderer、session transcript 和 HTML export。只看 `truncate()` 函数不足以判断影响。

## 5. 从源码追踪一个问题

假设用户说“Pi 如何恢复中断工具调用？”建议追：

```text
Agent tool execution/error result
 → AgentSession event and session entry
 → session projection on resume
 → retry/continue policy in coding-agent
 → corresponding tests and docs
```

然后与 Durable 对照：相同问题中 Durable 还要检查 task checkpoint、`replay` policy 和 storage commit。不要把两种运行时的保障混为一谈。

## 6. 练习与下一步

1. 将一次 coding-agent 运行画成 `input → context → model → tool → session → UI` 六节点图。
2. 选一个 provider adapter，追一个 stop reason 和一次 retry。
3. 给一个 file tool 找 schema validation、路径处理、输出截断、session event 四个落点。
4. 比较普通 session 与 Durable task 在重启时的恢复语义。

能把这些路径讲清楚，就掌握了 Pi 的主要架构。要继续深挖时，按 `packages/*/src` 的文件树读具体 API，不要只依赖这套概念课程；源码与测试始终是最终依据。

