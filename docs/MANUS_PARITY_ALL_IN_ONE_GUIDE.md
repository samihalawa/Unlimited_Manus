# Manus.im Parity — All‑in‑One Implementation Guide

Audience: Any engineer starting from any codebase (new or existing) who wants to deliver a Manus.im-equivalent agent experience: phase-based planning, structured tool execution, streaming observations, blocking questions, and a final deliverable with attachments.

This guide is repository-agnostic. It defines contracts, behaviors, schemas, UI patterns, and validation steps without relying on specific file names, frameworks, or languages.

---

## 0) Executive Overview

Goal: Implement an agent system with:
- Phase-based planning visible in the UI.
- Eleven interoperable tools with strict, consistent JSON parameters.
- A two-stage streaming protocol for tool actions (running → completed).
- A message tool used for all user-facing communication, including blocking questions and final results.
- Structured observations that the UI renders uniformly.
- Persistence for plans and schedules.
- A per-conversation workspace for artifacts.

The outcome is a UX indistinguishable from Manus.im while remaining portable across architectures and frameworks.

---

## 1) System Architecture

- Agent Loop
  - Produces/updates a multi-phase plan with a clear goal.
  - Iteratively analyzes, selects a tool, executes, observes, and repeats.
  - Advances phases strictly in order; completes when the plan finishes.
  - Communicates with users exclusively via the message tool.
  - Finalizes with a result message containing a succinct summary and attachments.

- Runtime
  - Accepts tool invocations and streams:
    - A “running” event with a human-readable description.
    - A “completed” event with a status and structured metadata.
  - Calls each tool with a uniform signature and wraps responses in the streaming envelope.

- Frontend
  - A persistent plan display (goal + ordered phases with statuses).
  - An observation stream visualizing every tool action.
  - Previews tailored to the action type (shell/file/search/etc.).
  - Inline reply UI for blocking questions that resume the loop.

- Persistence
  - Per-conversation plan state.
  - Optional model for scheduled jobs.
  - Workspace directory per conversation to store artifacts (slides, web scaffolds, images, etc.).

---

## 2) Streaming Contract

All tool actions emit exactly two envelopes (except “ask” which uses a special intermediate state):

1) Running envelope
```json
{
  "uuid": "action-uuid",
  "status": "running",
  "content": "Human-readable description of what is happening",
  "meta": {
    "action_type": "tool-or-domain.action-or-type",
    "tool": "tool-name",
    "phase_id": 2
  }
}
```

2) Completion envelope
```json
{
  "uuid": "action-uuid",
  "status": "success",
  "content": "Concise, user-comprehensible summary or structured payload",
  "meta": {
    "action_type": "tool-or-domain.action-or-type",
    "tool": "tool-name",
    "...": "tool-specific fields (see Tool Specs)"
  }
}
```

Special intermediate state for message.ask:
```json
{
  "uuid": "action-uuid",
  "status": "asking",
  "content": "Question posed to the user",
  "meta": {
    "action_type": "message.ask",
    "tool": "message",
    "suggested_action": "none | confirm | retry"
  }
}
```

Notes:
- Always include `meta.action_type`. The UI renderer keys off this.
- `uuid` is stable for both envelopes of the same action.
- Each tool accepts a `brief` parameter describing the operation intent.

---

## 3) Toolset (11 Tools)

Each tool exports a uniform interface:
- `name`: Unique tool name.
- `description`: One-line purpose.
- `params`: JSON Schema-ish shape (documented below).
- `memorized?`: Whether this tool maintains persistent conversational state.
- `getActionDescription(params)`: Short, human-readable text for the running envelope.
- `execute(params, uuid, context)`: Performs the action and returns the final payload (runtime wraps it into the completion envelope).

All tools accept a `brief` parameter. Field names are precise; adhere to them exactly.

### 3.1 plan
Purpose: Manage a phase-based plan with a clear goal and ordered phases.

Operations:
- `update`: Create or replace the plan.
- `advance`: Move to the next phase sequentially.

Input:
```json
{
  "action": "update | advance",
  "goal": "High-level objective",
  "phases": [
    { "id": 1, "title": "Phase title", "capabilities": {} }
  ],
  "brief": "Why this plan change is happening"
}
```

Output meta:
```json
{
  "action_type": "plan.update | plan.advance",
  "goal": "string",
  "phases": [
    { "id": 1, "title": "Phase title", "status": "pending | active | completed" }
  ],
  "current_phase_id": 1,
  "next_phase_id": 2
}
```

Rules:
- strictly sequential advancement (no skipping).
- memorize per conversation.

---

### 3.2 message
Purpose: All user-visible communication.

Types:
- `info`: Non-blocking progress update.
- `ask`: Blocking question; pauses the loop.
- `result`: Final summary; may attach artifacts.

Input:
```json
{
  "type": "info | ask | result",
  "text": "User-facing message",
  "suggested_action": "none | confirm | retry",
  "attachments": [
    { "name": "artifact", "path": "local-or-remote-path", "mime": "mime/type" }
  ],
  "brief": "Why we are sending this message"
}
```

Output meta:
```json
{
  "action_type": "message.info | message.ask | message.result",
  "attachments": [
    { "name": "artifact", "path": "local-or-remote-path", "mime": "mime/type" }
  ]
}
```

Behavior:
- `ask` emits `status=asking` and blocks until user responds.

---

### 3.3 shell
Purpose: Execute commands and manage interactive sessions.

Actions:
- `view`: Show sessions and/or last output.
- `exec`: Run a command in a session (create or reuse).
- `wait`: Await output until timeout.
- `send`: Send input to a running process (append newline).
- `kill`: Terminate a session/process.

Input:
```json
{
  "action": "view | exec | wait | send | kill",
  "session": "session-id",
  "command": "command to exec",
  "input": "stdin for send",
  "timeout": 120000,
  "brief": "Intent of this shell action"
}
```

Output meta:
```json
{
  "action_type": "shell.view | shell.exec | shell.wait | shell.send | shell.kill",
  "session": "session-id",
  "exit_code": 0,
  "stdout": "string (possibly truncated)",
  "stderr": "string (possibly truncated)"
}
```

---

### 3.4 file
Purpose: File operations (view/preview, text read/write, bulk edits).

Actions:
- `view`: Preview summary; return mime and optional derived text.
- `read`: Read text files (reject binary by extension).
- `write`: Create/overwrite text content.
- `append`: Append to text files.
- `edit`: Bulk structured edits.

Input:
```json
{
  "action": "view | read | write | append | edit",
  "path": "path/to/file",
  "text": "for write/append",
  "edits": [
    { "find": "exact or regex", "replace": "replacement", "all": true }
  ],
  "brief": "Intent of this file action"
}
```

Output meta:
```json
{
  "action_type": "file.view | file.read | file.write | file.append | file.edit",
  "path": "path/to/file",
  "mime": "mime/type",
  "derived_text": "optional summary",
  "edit_summary": [
    { "find": "pattern", "count": 2 }
  ]
}
```

Rules:
- `read` is for text only; gate by extension or detection.
- `view` is for images/pdf/office (and text); return mime + optional derived text.

---

### 3.5 match
Purpose: Glob for paths and grep for content with context lines.

Actions:
- `glob`: Match file paths using glob patterns.
- `grep`: Regex search within files, with leading/trailing context.

Input:
```json
{
  "action": "glob | grep",
  "scope": "base directory or scope",
  "glob": "**/*.ext",
  "regex": "pattern",
  "leading": 2,
  "trailing": 2,
  "brief": "Intent of this match action"
}
```

Output meta:
```json
{
  "action_type": "match.glob | match.grep",
  "results": [
    {
      "path": "path/to/file",
      "matches": [
        {
          "line": 42,
          "match": "text",
          "leading": ["..."],
          "trailing": ["..."]
        }
      ]
    }
  ]
}
```

---

### 3.6 search
Purpose: Multi-provider searches; image results are downloaded locally.

Types:
- `info`, `image`, `api`, `news`, `tool`, `data`, `research`

Input:
```json
{
  "type": "info | image | api | news | tool | data | research",
  "queries": ["q1", "q2"],
  "provider": "provider-key",
  "brief": "Intent of this search"
}
```

Output meta:
```json
{
  "action_type": "search.info | search.image | ...",
  "provider": "provider-key",
  "summary": "short synthesis",
  "payload": { "results": [] },
  "images": [
    { "path": "local-image-path", "thumb": "local-thumb-path", "width": 320, "height": 180 }
  ]
}
```

Rules:
- Respect environment/user search settings if present.
- For images, download to the workspace and return local paths.

---

### 3.7 schedule
Purpose: Create scheduled tasks.

Types:
- `cron`: Six-field cron format.
- `interval`: Milliseconds.

Input:
```json
{
  "type": "cron | interval",
  "name": "job name",
  "cron": "*/5 * * * * *",
  "interval": 60000,
  "repeat": 10,
  "prompt": "task prompt",
  "playbook": { "steps": [] },
  "brief": "Intent of this schedule"
}
```

Output meta:
```json
{
  "action_type": "schedule.cron | schedule.interval",
  "id": "scheduled-task-id",
  "name": "job name",
  "type": "cron | interval",
  "cron": "*/5 * * * * *",
  "interval": 60000,
  "repeat": 10,
  "created_at": "iso-timestamp"
}
```

Notes:
- Persist jobs; a simple engine can register jobs on creation or at app start.

---

### 3.8 expose
Purpose: Expose a local port with a temporary public URL.

Input:
```json
{
  "port": 3000,
  "brief": "Why we are exposing"
}
```

Output meta:
```json
{
  "action_type": "expose",
  "port": 3000,
  "url": "http://public-or-local-url",
  "exposed": true
}
```

Notes:
- If no tunnel is available, return a local URL and mark `exposed=false`.

---

### 3.9 generate
Purpose: Toggle generation mode to influence subsequent content creation.

Input:
```json
{
  "brief": "Why generation mode is enabled"
}
```

Output meta:
```json
{
  "action_type": "generate",
  "mode": "generation",
  "active": true
}
```

---

### 3.10 slides
Purpose: Convert markdown into an HTML slide deck.

Input:
```json
{
  "slide_count": 10,
  "slide_content_file_path": "path-to-markdown",
  "brief": "What deck is being created"
}
```

Output meta:
```json
{
  "action_type": "slides",
  "deck_path": "local-html-deck-path",
  "slide_count": 10
}
```

---

### 3.11 webdev_init_project
Purpose: Scaffold a web project in the conversation workspace.

Input:
```json
{
  "features": "web-static | web-db-user",
  "name": "project-name",
  "brief": "Intent of this scaffold"
}
```

Output meta:
```json
{
  "action_type": "webdev_init_project",
  "project_name": "project-name",
  "features": "web-static | web-db-user",
  "paths": [
    "project-root",
    "notable-files-or-folders"
  ]
}
```

Notes:
- `web-static`: baseline static site structure.
- `web-db-user`: minimal server, simple user model, basic auth endpoints, helpful scripts, and README.

---

## 4) Agent Loop Integration

Lifecycle:
1) Auto-Reply
   - Immediately emit `message.info` acknowledging the user request.

2) Planning
   - Emit `plan.update` with a goal and ordered phases (2 for simple tasks, 4–6 typical, 10+ complex).
   - Persist plan per conversation.
   - Mark phase 1 as `active`.

3) Execute by Phase
   - Analyze → choose tool → execute → observe → iterate.
   - Stream “running” then “success” for every action.
   - If `message.ask`, emit `asking` and pause until the user responds.
   - Push key findings into memory to inform subsequent steps.

4) Advance
   - When a phase is done, emit `plan.advance` to move strictly to the next phase.

5) Finalize
   - Emit `message.result` with concise summary and attachments.
   - Optionally persist the summary or deliverables index as conversation artifacts.

Selection Guidelines:
- Prefer specialized or provider-backed tools when available.
- Always use the message tool for user-visible content.
- Always begin with `plan.update` and move phases with `plan.advance`.

---

## 5) Runtime Integration

Responsibilities:
- Tool Registration: Expose all tools to the agent and tool prompt.
- Running State:
  - Call `getActionDescription(params)` and emit a `running` envelope.
- Execution:
  - Invoke `execute(params, uuid, context)`.
  - Wrap outputs in a `success` envelope with `meta.action_type`.
- Memorization:
  - Persist needed state for tools declaring `memorized` (plan, etc.).

Invocation Signature:
- `params`: Tool parameters (adhering to schemas).
- `uuid`: Action correlation id for streaming.
- `context`: Conversation-scoped state (plan, settings, workspace paths, memory, etc.).

---

## 6) Frontend Integration

Plan Display:
- Persistent panel showing:
  - Goal
  - Ordered phases
  - Status: pending | active | completed
- Subscribe to `plan.update` and `plan.advance` envelopes.

Observation Stream:
- Render a compact entry for each action using `meta.action_type`:
  - `plan.*`, `message.*`, `shell.*`, `file.*`, `match.*`, `search.*`, `schedule.*`, `expose`, `generate`, `slides`, `webdev_init_project`.
- Provide per-type previews:
  - Shell: stdout/stderr with basic terminal styling.
  - Match/Search: structured results; thumbnails for image results.
  - File: text preview with highlighting; fallback to native viewers for images/pdf/office.
  - Generic: JSON viewer for arbitrary payloads.

Blocking Questions:
- For `message.ask` (status=asking), render the question with an inline reply box.
- On reply, post the response, resume the agent loop, and continue streaming.

Modes:
- If multiple conversation modes exist (e.g., chat vs agent), route events appropriately and keep views consistent.

---

## 7) Data & Models

Per-Conversation Plan State:
- Fields:
  - goal
  - phases: [{ id, title, status }]
  - current_phase_id
  - next_phase_id
  - timestamps

Scheduled Task (optional for schedule tool):
- Fields:
  - id, user_id, name, type ("cron" | "interval")
  - cron (six-field string), interval (ms), repeat (optional int)
  - prompt (string), playbook (JSON)
  - created_at, updated_at

Workspace:
- A directory per conversation:
  - Stores generated slides, web scaffolds, downloaded images, and other deliverables.
  - Paths in tool outputs should be relative to (or resolvable within) this workspace.

---

## 8) Parameter Naming Compliance

Use precise parameter names:
- message: `text` (not `content`)
- shell: `session` (not `session_id`)
- match: `regex` (not `pattern`)
- search: `queries` (array; not single `query`)
- web scaffold: `features` (not `preset`)
- Every tool accepts: `brief`

These names are critical for predictable agent behavior and UI rendering.

---

## 9) Example Flows

A) Plan creation:
```json
{
  "tool": "plan",
  "params": {
    "action": "update",
    "goal": "Build a notes application with auth",
    "phases": [
      { "id": 1, "title": "Environment Setup", "capabilities": {} },
      { "id": 2, "title": "Backend API", "capabilities": {} },
      { "id": 3, "title": "Frontend UI", "capabilities": {} },
      { "id": 4, "title": "Polish & Delivery", "capabilities": {} }
    ],
    "brief": "Initialize plan structure"
  }
}
```

B) Ask the user (blocking):
```json
{
  "tool": "message",
  "params": {
    "type": "ask",
    "text": "Which database do you prefer: SQLite or PostgreSQL?",
    "suggested_action": "none",
    "brief": "DB choice is needed to proceed"
  }
}
```

C) Bulk file edits:
```json
{
  "tool": "file",
  "params": {
    "action": "edit",
    "path": "api/server.js",
    "edits": [
      { "find": "const PORT = 3000", "replace": "const PORT = 8080", "all": false },
      { "find": "localhost", "replace": "0.0.0.0", "all": true }
    ],
    "brief": "Bind to 0.0.0.0 and serve on 8080"
  }
}
```

D) Search images (download locally for preview):
```json
{
  "tool": "search",
  "params": {
    "type": "image",
    "queries": ["modern note taking UI inspiration"],
    "provider": "preferred-provider",
    "brief": "Collect UI references"
  }
}
```

E) Expose a service:
```json
{
  "tool": "expose",
  "params": {
    "port": 8080,
    "brief": "Share live preview URL"
  }
}
```

F) Final result with attachments:
```json
{
  "tool": "message",
  "params": {
    "type": "result",
    "text": "Project completed. See attached artifacts.",
    "attachments": [
      { "name": "App URL", "path": "http://public-url", "mime": "text/uri-list" },
      { "name": "README", "path": "workspace/project/README.md", "mime": "text/markdown" }
    ],
    "brief": "Deliverables and summary"
  }
}
```

---

## 10) Greenfield vs. Brownfield Adoption

Greenfield (from scratch):
- Start by implementing the streaming contract in your runtime.
- Add the message and plan tools first (to establish the core UX).
- Implement the observation feed and plan panel UI.
- Add shell and file tools to unlock real project work.
- Layer in match/search/schedule/expose/generate/slides/web scaffold for breadth.

Brownfield (existing codebase):
- Map your current streaming or logging to the contract envelopes.
- Wrap existing capabilities as tools with the specified params and meta.
- Route plan updates and advances into your existing state/store.
- Replace ad-hoc user messages with the message tool.
- Gradually migrate existing operations into structured tool actions.

---

## 11) Validation & Acceptance

One-pass validation (example command: “Build a notes app with auth”):
1) An immediate `message.info` acknowledges the request.
2) A `plan.update` appears with a goal and 4–6 phases; the plan panel shows the active phase.
3) Tool observations stream as the agent works (consistent running → success envelopes).
4) If a blocking choice is needed, a `message.ask` renders with a reply box; replying resumes the loop.
5) Phases flip from pending → active → completed; `plan.advance` is visible.
6) A final `message.result` arrives with a clear summary and relevant attachments.

Acceptance checklist:
- All 11 tools are discoverable and follow the parameter schemas.
- Each action includes `meta.action_type` and streams running → success.
- Plan is persisted per conversation; advancement is strictly sequential.
- All user-facing content goes through the message tool.
- Image search downloads images locally and previews correctly.
- Web project scaffold is generated in the workspace and is discoverable via the UI.
- Final result includes summary and attachments representing deliverables.

---

## 12) Implementation Notes (Key Gotchas)

- Always include `meta.action_type` for UI mapping.
- `message.ask` must pause the loop; resume precisely where it left off when the user responds.
- `file.read` vs `file.view`: only `read` text files; use `view` for non-text formats and return `mime` with optional derived text.
- `match.grep` returns regex matches with leading/trailing context arrays.
- `search.image` saves images locally (thumbnails optional but recommended).
- `plan.advance` cannot skip; maintain `current_phase_id` and `next_phase_id`.

---

## 13) Quick Reference (Meta by Tool)

- plan → `{ action_type, goal, phases[], current_phase_id, next_phase_id }`
- message → `{ action_type, attachments[] }`
- shell → `{ action_type, session, exit_code, stdout, stderr }`
- file → `{ action_type, path, mime, derived_text?, edit_summary?[] }`
- match → `{ action_type, results[] }`
- search → `{ action_type, provider, summary, payload, images?[] }`
- schedule → `{ action_type, id, name, type, cron?, interval?, repeat?, created_at }`
- expose → `{ action_type, port, url, exposed }`
- generate → `{ action_type, mode: "generation", active: true }`
- slides → `{ action_type, deck_path, slide_count }`
- webdev_init_project → `{ action_type, project_name, features, paths[] }`

---

## 14) Tool Prompt Guidance (for the Agent)

- MUST use only known tools and schemas.
- SHOULD prefer provider-backed tools when available.
- MUST create or refresh a plan at the start (`plan.update`).
- MUST advance phases (`plan.advance`) sequentially upon completion.
- MUST use `message` for all user-visible content.
- SHOULD keep outputs concise, structured, and easy to render.

---

## 15) Appendix: Minimal Envelope Examples

Running:
```json
{
  "uuid": "abc123",
  "status": "running",
  "content": "Searching for UI references (image, 1 query)",
  "meta": { "action_type": "search.image", "tool": "search" }
}
```

Success:
```json
{
  "uuid": "abc123",
  "status": "success",
  "content": "Found 12 images; downloaded 6 for preview",
  "meta": {
    "action_type": "search.image",
    "tool": "search",
    "provider": "preferred-provider",
    "summary": "High-quality UI inspirations collected",
    "images": [
      { "path": "workspace/images/ui1.png", "thumb": "workspace/images/ui1_thumb.png", "width": 320, "height": 180 }
    ]
  }
}
```

Asking:
```json
{
  "uuid": "ask-001",
  "status": "asking",
  "content": "Choose a database: SQLite or PostgreSQL?",
  "meta": { "action_type": "message.ask", "tool": "message", "suggested_action": "none" }
}
```

This handbook is designed to be dropped into any environment to guide a complete Manus.im‑style implementation with predictable behaviors, streaming, and UX parity.