# t-minus-t Decisions

_Architecture decisions recorded by GuildHall agents._

## [rem-task-003-1-issue] Remediation: restart_from_checkpoint (issue trigger)
**Date:** 2026-05-14T15:36:56.530Z
**Agent:** coordinator-remediation (converter-core)
**Task:** task-003

**Context:** trigger=issue; task=task-003; agent=worker-agent; prior_attempts=0; checkpoint=step 377 (2026-05-14T14:42:12.512Z); event_density=unknown; files_touched=0; levers=[remediation_autonomy=confirm_destructive, crash_recovery_default=prefer_resume, agent_health_strictness=standard]

**Decision:** restart_from_checkpoint. Rationale: The worker did not mutate or escalate after checkpoint-directed no-progress stops. Restarting from the durable checkpoint is non-destructive and gives the worker one clean recovery attempt before human escalation.

**Consequences:** autonomous — executed immediately

---