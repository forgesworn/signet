@AGENTS.md

## Subagent Model Selection

When dispatching subagents via the Agent tool, choose the model based on task complexity:

- **Haiku**: file searches, codebase exploration, simple lookups, summarising content, simple questions
- **Sonnet**: well-defined implementation tasks with clear instructions, straightforward code changes, find-and-replace edits, running tests, code reviews
- **Opus**: complex multi-step reasoning, architectural decisions, ambiguous requirements, large refactors with many interdependent changes, brainstorming and design work

Default to **Sonnet** unless the task genuinely needs Opus-level reasoning. Prefer the cheapest model that can reliably complete the task.

### Guidance by agent type

| Agent type | Default model | Rationale |
|------------|---------------|-----------|
| `Explore` | Haiku | Read-only, no Edit/Write tools: fast search is all that's needed |
| `general-purpose` | Sonnet | Most implementation work is well-scoped by the time it's dispatched |
| `Plan` | Opus | Planning benefits from deeper reasoning about trade-offs |
| `superpowers:code-reviewer` | Sonnet | Review against known criteria is systematic, not creative |

### Guidance by skill

| Skill | Recommended model | Rationale |
|-------|-------------------|-----------|
| `brainstorming` | Opus | Exploring intent, requirements, and design needs strong reasoning |
| `writing-plans` | Opus | Multi-step planning with architectural trade-offs |
| `executing-plans` | Sonnet | Following an already-written plan with clear steps |
| `subagent-driven-development` | Sonnet (per subagent) | Each subagent gets a well-scoped task from the plan |
| `test-driven-development` | Sonnet | Writing tests and implementation from clear requirements |
| `systematic-debugging` | Sonnet | Structured process; escalate to Opus if root cause is elusive |
| `requesting-code-review` | Sonnet | Checking work against known requirements |
| `verification-before-completion` | Haiku | Running commands and confirming output: minimal reasoning needed |
| `finishing-a-development-branch` | Sonnet | Straightforward merge/PR workflow |
