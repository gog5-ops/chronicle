---
name: knowledge-ops
description: Operate the knowledge management system — chronicle, issue sync, truth verification, audit, and worker execution. Any agent loading this skill can participate in knowledge management.
---

# Knowledge Ops Skill

You are operating the knowledge management system. This skill gives you everything needed to maintain the chronicle, verify truth sources, sync issues, run audits, and execute workers.

## System Layout

```
/opt/opshub/wiki/                    # Wiki (truth source, layer 1)
├── chronicle/YYYY-MM.md             # 编年体 (monthly files)
├── arch/                            # Architecture docs
├── ops/runbook-*.md                 # Runbooks
├── projects/{name}/                 # Per-project knowledge
└── accounts/service-registry.md     # Service registry

/opt/opshub/logs/ops.log             # Operations log (append-only)
/opt/opshub/scripts/                 # Reusable scripts
~/chronicle/                         # This repo (tools + API)
```

## Operations

### 1. Chronicle — 编年体追加/查询

The chronicle is the global timeline of all agent activity. Monthly files at `/opt/opshub/wiki/chronicle/YYYY-MM.md`.

**Append an entry:**

```bash
# Get current date
DATE=$(date -u +%Y-%m-%d)
MONTH_FILE="/opt/opshub/wiki/chronicle/$(date -u +%Y-%m).md"

# Append entry in this format:
cat >> "$MONTH_FILE" << 'ENTRY'

### HH:MM UTC — {Actor}: {Task title}
- **Issue**: opshub#{N}
- **做了什么**: {summary of actions taken}
- **关键发现**: {key findings, if any}
- **产出**: {artifacts: PRs, scripts, docs}
- **错误路径**: {wrong approaches tried, if any}
ENTRY
```

**Format rules:**
- Group by date (`## YYYY-MM-DD`)
- Each entry: `### HH:MM UTC — {Actor}: {Task title}`
- Actor: `Claude`, `Hermes`, `User`, or agent name
- Always include Issue reference if one exists
- Record error paths — this is the chronicle's unique value over issue comments

**Query:**
```bash
# Recent entries
tail -50 /opt/opshub/wiki/chronicle/$(date -u +%Y-%m).md

# Search for topic
grep -i "keyword" /opt/opshub/wiki/chronicle/*.md

# Find entries for a specific issue
grep "opshub#79" /opt/opshub/wiki/chronicle/*.md
```

### 2. Issue Sync — Issue 增量同步

Scan `gog5-ops/opshub` for recent activity. Record findings to chronicle.

```bash
# List recently updated issues
gh issue list --repo gog5-ops/opshub --sort updated --limit 20

# View issue with comments
gh issue view {N} --repo gog5-ops/opshub --comments

# Search issues by keyword
gh issue list --repo gog5-ops/opshub --search "keyword"

# Create issue
gh issue create --repo gog5-ops/opshub --title "title" --body "body"

# Comment on issue (decision record, scope change, etc.)
gh issue comment {N} --repo gog5-ops/opshub --body "structured comment"
```

**Issue comment format for decisions:**
```markdown
## 决策: {topic}
- **选项 A**: ... → 排除，因为 ...
- **选项 B**: ... → 采纳，因为 ...
- **结论**: ...
```

### 3. Truth Verification — 真相源校验

Compare what wiki/runbooks say vs what actually exists. Report inconsistencies.

**Procedure:**
```bash
# 1. Find all runbooks
find /opt/opshub/wiki/ops -name "runbook-*.md"

# 2. For each runbook, extract script references
grep -oP '(?<=`)[^`]*\.sh(?=`)' /opt/opshub/wiki/ops/runbook-*.md

# 3. Verify each referenced script exists and is non-empty
for script in $(grep -ohP '/opt/opshub/scripts/[^\s`"]+' /opt/opshub/wiki/ops/runbook-*.md); do
  if [ ! -s "$script" ]; then
    echo "MISSING or EMPTY: $script"
  fi
done

# 4. Compare runbook commands vs actual script content
# Read the runbook's "how to restart" section
# Read the actual script
# Flag differences
```

**Report format:**
```markdown
## Truth Verification Report — YYYY-MM-DD

### Inconsistencies Found
| Source | Claim | Reality | Action Needed |
|--------|-------|---------|---------------|
| runbook-slack.md | `bash start.sh` | script uses `server:slack` | Update runbook |

### Verified OK
- runbook-X.md: 3/3 scripts present and match
```

### 4. Audit — 执行审计

Review recent Claude sessions/activity for compliance with established rules.

**Audit dimensions:**
1. **Preflight**: Did the agent check issue history / runbook before acting?
2. **Error path efficiency**: How many failures before changing direction? (target: ≤3)
3. **Knowledge capture**: Was conclusion recorded in issue comment?
4. **Script output**: Did service operations produce a reusable script?
5. **Research capture**: Were WebSearch/WebFetch results recorded in issue?

**Produce audit report:**
```markdown
## Audit Report — YYYY-MM-DD

### Sessions Reviewed
- {issue#}: {task description}

### Findings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Preflight | ✅/❌ | {detail} |
| Error efficiency | N failures | {detail} |
| Knowledge capture | ✅/❌ | {detail} |
| Script output | ✅/N/A | {detail} |
| Research capture | ✅/N/A | {detail} |

### Recommendations
- {actionable suggestion}
```

### 5. Health Check — 服务健康检查

```bash
# Check tmux sessions
for session in slack telegram hermes; do
  if tmux has-session -t "$session" 2>/dev/null; then
    echo "✅ $session: running"
  else
    echo "❌ $session: DOWN"
  fi
done

# Check key processes
pgrep -f "server.ts" > /dev/null && echo "✅ slack server" || echo "❌ slack server"

# Check ports
ss -tlnp | grep -E ':(3001|8001|8080)' || echo "⚠️ Expected ports not listening"
```

### 6. Ops Log — 操作日志

All significant operations get logged to `/opt/opshub/logs/ops.log`.

**Write to ops log:**
```bash
OPS_LOG="/opt/opshub/logs/ops.log"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) [${ACTOR}] [${CONTEXT}] ${MESSAGE} → ${RESULT}" >> "$OPS_LOG"
```

**Format:** `ISO_TIMESTAMP [actor] [context] message → result`

### 7. Script Capture — 成功操作脚本化

When a service operation succeeds, capture it:

```bash
# Write script to appropriate directory
cat > /opt/opshub/scripts/recovery/{service}-{action}.sh << 'SCRIPT'
#!/bin/bash
# Description: {what this does}
# Created: YYYY-MM-DD from opshub#{N}
{commands}
SCRIPT
chmod +x /opt/opshub/scripts/recovery/{service}-{action}.sh

# Update runbook reference
# Add to issue comment
```

## Execution Rules

1. **Always log**: Every operation you perform → append to ops.log
2. **Always chronicle**: After completing a meaningful task → append chronicle entry
3. **3-strike rule**: If you fail 3 times at the same approach, stop and change direction
4. **Issue-first**: Before starting work, find or create the relevant issue
5. **Capture success**: Service operations that work → write script + update runbook

## Handoff Protocol

When handing this role to another agent (Hermes or other):
1. Ensure ops.log is current
2. Chronicle has today's entries
3. Any in-progress work is noted in the relevant issue
4. Health check passes

The receiving agent loads this same skill and continues from where you left off.
