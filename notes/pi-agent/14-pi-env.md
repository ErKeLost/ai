# 第 14 章：`pi-env`——把工具执行放到另一台机器

## 学习目标

理解 Durable 的 `ExecutionEnv` 如何屏蔽本地和远程执行差异，`pi-env` daemon 怎样通过 SSH 部署，wire protocol 如何处理文件、命令、取消和连接失效。

## 1. 执行环境抽象

Agent 工具可能需要读项目文件、写文件、跑命令、监听变化。把 `process.cwd()` 和 Node `fs` 写死在工具实现里，就无法复用到远程主机、Cloudflare 或测试环境。Durable 用 `ExecutionEnv` 表达这些操作；工具依赖该接口而不是依赖某个特定 OS 进程。

```text
Durable read/write/bash tool
            │ ExecutionEnv
   ┌────────┴─────────┐
NodeExecutionEnv   RemoteExecutionEnv
                      │ Connection
                    pi-env daemon
```

## 2. SSH bootstrap

pi-env 提供 Rust daemon。`connectSsh()` 验证 host key、检测远端系统、按 platform/arch 找 daemon，并在需要时部署；之后通过 SSH 启动 daemon，用 stdin/stdout 交换 framed messages。

```ts
const target = {
  host: "build-box",
  knownHostsFile: "/data/ssh/known_hosts",
  hostKeyAlias: "pi-env-build",
};
const { connection } = await connectSsh(target);
const env = new RemoteExecutionEnv({
  connection,
  id: "pi-env:build-box",
  cwd: "/home/dev/project",
});
```

主机公钥首次接受必须由 owner 核对 fingerprint；仅仅“SSH 连接成功”不代表目的机器可信。daemon 按 SHA-256 名称部署，并在启动前校验二进制。

## 3. Framed protocol 的职责

每个 frame 有长度、类型、request id、JSON header 和可选 raw payload。request/result/error 对应一次操作；event 表示命令输出、pty 或 watch 的进度；cancel 指定请求 id。stderr 用于诊断，stdout 只承载握手和 frame。

```text
client: request(id=7, op="exec")
daemon: event(id=7, stdout chunk)
daemon: event(id=7, stdout chunk)
client: cancel(id=7)
daemon: result/error(id=7, aborted)
```

断链会让运行中的进程组终止；旧 connection 上的 file handles 不能被新 daemon 接管。client 下次请求可以重新部署/连接，但不能假装之前的 handle 还有效。

## 4. 映射与兼容

远程路径按目标 platform 解析，string command 在 Windows 通过 Git Bash 执行，argv 可直接启动；`listFiles` 有 daemon feature negotiation，旧 daemon 不支持时客户端回退。RemoteExecutionEnv 尽量遵循 NodeExecutionEnv semantics，错误文本可能不同。

例：调用 `env.exec({command:"pwd"})` 时，工具只依赖 ExecutionEnv 结果；测试可以把同样的随机操作序列分别跑在本地与 daemon 侧，对比行为。

## 5. 安全与源码

SSH 参数默认启用 BatchMode、严格 host-key checking、禁用 agent/port/X11 forwarding 和 connection sharing；protocol 把命令、文件操作以及取消明确分开。远端工作目录的权限仍由远端操作系统账户决定。

- [README](../../pi/packages/env/README.md)
- [remote-env.ts](../../pi/packages/env/src/remote-env.ts)、[connection.ts](../../pi/packages/env/src/connection.ts)、[ssh.ts](../../pi/packages/env/src/ssh.ts)
- [protocol.md](../../pi/packages/env/docs/protocol.md)、`docs/semantics.md`
- Rust daemon：`packages/env/daemon/`

练习：在 `protocol.md` 找 `exec` request 与 cancel 规则，解释为什么“取消远端等待 promise”不能替代“杀掉远端命令进程组”。

