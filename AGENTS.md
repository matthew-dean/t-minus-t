# Agent Instructions

<!-- BEGIN Guildhall MCP bridge -->
## Guildhall MCP Bridge

t-minus-t is a Guildhall project. When Guildhall MCP tools are available, use them as the first source of project context before reading raw `.guildhall/` files.

Start with these MCP resources:

- `guildhall://project`
- `guildhall://project/tasks`
- `guildhall://project/artifacts`
- `guildhall://project/decisions`
- `guildhall://project/memory`

For artifact-scoped work, resolve IDs through `guildhall://project/artifacts` and prefer `guildhall.read_artifact` over guessing paths. If the task changes project state, use `guildhall.append_task_evidence` for audit notes when there is an active Guildhall task. If an external agent needs permission, tools, or host access it does not have, use `guildhall.create_capability_request` instead of silently working around the missing capability.

To start the local MCP server from this project root:

```sh
guildhall mcp serve .
```

If Guildhall MCP tools are not configured in the current agent session, say so explicitly and fall back to normal repository inspection. Do not imply that filesystem reads came from Guildhall MCP.
<!-- END Guildhall MCP bridge -->
