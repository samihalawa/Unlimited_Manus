# Manus Tool Reference Guide

This document provides a comprehensive reference for all available tools, including their purpose, supported actions, detailed instructions, recommended usage, and the complete function schema.

---

## 1. `plan`

> **Description:** Create, update, and advance the structured task plan.

### Supported Actions
- `update`: Create or revise the current task plan based on user input or newly discovered information.
- `advance`: Move to the next phase in the existing plan when the current phase has been fully completed.

### Instructions
- MUST `update` the task plan when user makes new requests or changes requirements.
- A task plan includes one goal and multiple phases to guide the task.
- Phase count scales with task complexity: simple (2), typical (4-6), complex (10+).
- Phases should be high-level units of work, not implementation details.
- Make delivering results to the user a separate phase, typically the final phase.
- When confident a phase is complete, MUST advance using the `advance` action.
- `next_phase_id` MUST be the next sequential ID after `current_phase_id`.
- Skipping phases or going backward is NOT allowed, as it indicates the plan needs to be revised using the `update` action.

### Recommended Usage
- Use `update` to create the initial task plan at the start of a new task.
- Use `update` to update the task plan when user makes a new request.
- Use `update` to revise the task plan when new information is discovered.
- Use `advance` when the current phase is complete and the next phase is ready to start.

### Schema
```json
{
  "action": {
    "description": "The action to perform",
    "enum": ["update", "advance"],
    "type": "STRING"
  },
  "current_phase_id": {
    "description": "ID of the phase the task is currently in. Must be one of the IDs in the latest `phases` list.",
    "type": "INTEGER"
  },
  "goal": {
    "description": "The overall goal of the task, written as a clear and concise sentence. Required for `update` action.",
    "type": "STRING"
  },
  "next_phase_id": {
    "description": "ID of the phase the task is advancing to. Must be one of the IDs in the latest `phases` list. Required for `advance` action.",
    "type": "INTEGER"
  },
  "phases": {
    "description": "Complete list of phases required to achieve the task goal. Required for `update` action.",
    "type": "ARRAY",
    "items": {
      "type": "OBJECT",
      "properties": {
        "id": { "type": "INTEGER" },
        "title": { "type": "STRING" },
        "capabilities": { "type": "OBJECT" }
      }
    }
  }
}
```

---

## 2. `message`

> **Description:** Send messages to interact with the user.

### Supported Types
- `info`: Inform user with acknowledgment or progress updates without requiring a response from the user.
- `ask`: Ask the user a question and block until a response from the user is received.
- `result`: Deliver final results to the user and end the task.

### Instructions
- MUST use this tool for any communication with users instead of direct responses.
- MUST respond immediately to new user messages before taking any other actions.
- For new tasks, the first reply MUST be a brief acknowledgment without providing solutions.
- NEVER provide direct answers without proper reasoning or prior analysis.
- Actively use `info` type to provide progress updates.
- Use `ask` type only when necessary to avoid blocking the task or disrupting the user.
- MUST use `result` type to present final results and deliverables to the user at the end of the task.
- MUST attach all relevant files in `attachments`.
- NEVER deliver intermediate notes as the only result; MUST prepare information-rich but readable final versions.
- DO NOT send long-form content in `text`; use documents in `attachments` instead.
- MUST use `ask` type with `confirm_browser_operation` before sensitive browser operations (e.g., posting content).
- Use `ask` type with `take_over_browser` when user takeover is required (e.g., login).
- Use `ask` type with `upgrade_to_unlock_feature` when the user needs to upgrade subscription to unlock a feature.

### Recommended Usage
- Use `info` to acknowledge initial user messages and confirm task start.
- Use `info` to notify user of progress checkpoints or decisions made.
- Use `ask` to disambiguate unclear goals, confirm intent, or get sensitive input.
- Use `ask` with `confirm_browser_operation` before posting, paying, or submitting forms.
- Use `ask` with `take_over_browser` when a login, CAPTCHA, or manual step is required.
- Use `result` to deliver final answer and attachments at the end of the task.

### Schema
```json
{
  "attachments": {
    "description": "A list of attachments to include with the message",
    "type": "ARRAY",
    "items": { "type": "STRING" }
  },
  "suggested_action": {
    "description": "The suggested action for the user to take. Optional and only used for `ask` type.",
    "enum": ["none", "confirm_browser_operation", "take_over_browser", "upgrade_to_unlock_feature"],
    "type": "STRING"
  },
  "text": {
    "description": "The message or question text to be shown to the user",
    "type": "STRING"
  },
  "type": {
    "description": "The type of the message",
    "enum": ["info", "ask", "result"],
    "type": "STRING"
  }
}
```

---

## 3. `shell`

> **Description:** Interact with shell sessions in the sandbox environment.

### Supported Actions
- `view`: View the content of a shell session.
- `exec`: Execute command in a shell session.
- `wait`: Wait for the running process in a shell session to return.
- `send`: Send input to the active process (stdin) in a shell session.
- `kill`: Terminate the running process in a shell session.

### Instructions
- Prioritize using `file` tool instead of this tool for file content operations.
- MUST avoid commands that require confirmation; use flags like `-y` or `-f`.
- Avoid commands with excessive output; redirect to files when necessary.
- Chain multiple commands with `&&` to reduce interruptions and handle errors cleanly.
- NEVER run code directly via interpreter commands; MUST save code to a file before execution.
- Set a short `timeout` (such as 5s) for commands that don't return (like starting web servers).
- Use `wait` action when a command needs additional time to complete and return.
- When using `send`, add a newline character (`\n`) at the end of the `input` parameter to simulate pressing Enter.

### Recommended Usage
- Use `view` to check shell session history and latest status.
- Use `exec` to install packages or dependencies.
- Use `exec` to copy, move, or delete files.
- Use `wait` to wait for the completion of long-running commands.
- Use `send` to interact with processes that require user input.
- Use `kill` to stop background processes that are no longer needed.

### Schema
```json
{
  "action": {
    "description": "The action to perform",
    "enum": ["view", "exec", "wait", "send", "kill"],
    "type": "STRING"
  },
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "command": {
    "description": "The shell command to execute. Required for `exec` action.",
    "type": "STRING"
  },
  "input": {
    "description": "Input text to send to the interactive session. End with a newline character (\\n) to simulate pressing Enter if needed. Required for `send` action.",
    "type": "STRING"
  },
  "session": {
    "description": "The unique identifier of the target shell session",
    "type": "STRING"
  },
  "timeout": {
    "description": "Timeout in seconds to wait for command execution. Optional and only used for `exec` and `wait` actions. Defaults to 30 seconds.",
    "type": "INTEGER"
  }
}
```

---

## 4. `file`

> **Description:** Perform operations on files in the sandbox file system.

### Supported Actions
- `view`: View file content through multimodal understanding (e.g., images, PDFs).
- `read`: Read file content as text (e.g., code, Markdown).
- `write`: Overwrite the full content of a text file.
- `append`: Append content to a text file.
- `edit`: Make targeted edits to a text file.

### Instructions
- Prioritize using this tool for file content operations instead of the `shell` tool.
- For file copying, moving, and deletion operations, use the `shell` tool.
- `view` is for multimodal files; `read` is for text-based files.
- If the `range` parameter is not specified, the entire file will be read by default.
- `write` and `append` actions will automatically create files if they do not exist.
- DO NOT write partial or truncated content, always output full content.
- After browsing, reading, or conducting media analysis, MUST immediately save key findings to intermediate files.
- `edit` can make multiple edits to a single file at once.

### Recommended Usage
- Use `view` to view image files or specific pages of PDF files.
- Use `read` to read text files or extract text from documents.
- Use `write` to create files and record key findings or rewrite short documents.
- Use `append` to write long content in segments.
- Use `edit` to fix errors in code or update markers in todo lists.

### Schema
```json
{
  "action": {
    "description": "The action to perform",
    "enum": ["view", "read", "write", "append", "edit"],
    "type": "STRING"
  },
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "edits": {
    "description": "A list of edits to be sequentially applied to the file. Required for `edit` action.",
    "type": "ARRAY",
    "items": {
      "type": "OBJECT",
      "properties": {
        "all": { "type": "BOOLEAN" },
        "find": { "type": "STRING" },
        "replace": { "type": "STRING" }
      }
    }
  },
  "path": {
    "description": "The absolute path to the target file",
    "type": "STRING"
  },
  "range": {
    "description": "An array of two integers specifying the start and end of the range. Numbers are 1-indexed, and -1 for the end means read to the end of the file. Optional and only used for `view` and `read` actions.",
    "type": "ARRAY",
    "items": { "type": "INTEGER" }
  },
  "text": {
    "description": "The content to be written or appended. Required for `write` and `append` actions.",
    "type": "STRING"
  }
}
```

---

## 5. `match`

> **Description:** Find files or text in the sandbox file system using pattern matching.

### Supported Actions
- `glob`: Match file paths and names using glob-style patterns.
- `grep`: Search file contents using regex-based full-text matching.

### Instructions
- `glob` action matches only file names and paths, returning a list of matching files.
- `grep` action searches for a `regex` pattern inside all files matching `scope`.
- `scope` defines the glob pattern that restricts the search range for both actions.
- `scope` must be a glob pattern using absolute paths, e.g., `/home/ubuntu/**/*.py`.
- `regex` applies only to `grep` action and is case sensitive by default.

### Recommended Usage
- Use `glob` to locate files by name, extension, or directory pattern.
- Use `grep` to find occurrences of specific text across files.
- Use `grep` with `leading` and `trailing` to view surrounding context in code or logs.

### Schema
```json
{
  "action": {
    "description": "The action to perform",
    "enum": ["glob", "grep"],
    "type": "STRING"
  },
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "leading": {
    "description": "Number of lines to include before each match as context. Optional and only used for `grep` action. Defaults to 0.",
    "type": "INTEGER"
  },
  "regex": {
    "description": "The regex pattern to match file content. Required for `grep` action.",
    "type": "STRING"
  },
  "scope": {
    "description": "The glob pattern that defines the absolute file path and name scope",
    "type": "STRING"
  },
  "trailing": {
    "description": "Number of lines to include after each match as context. Optional and only used for `grep` action. Defaults to 0.",
    "type": "INTEGER"
  }
}
```

---

## 6. `search`

> **Description:** Search for information across various sources.

### Supported Types
- `info`: General web information, articles, and factual answers.
- `image`: Images relevant to the topic; automatically downloaded and locally saved.
- `api`: APIs that can be invoked programmatically, including documentation and sample code.
- `news`: Time-sensitive news content from trusted media sources.
- `tool`: External tools, services, platforms, or web applications.
- `data`: Public datasets, downloadable tables, dashboards, or structured data sources.
- `research`: Academic publications, papers, whitepapers, or government/industry reports.

### Instructions
- MUST use this tool to access up-to-date or external information.
- MUST use this tool to collect assets before creating documents, presentations, or websites.
- DO NOT rely solely on search result snippets; MUST follow up by navigating to the source URLs using browser tools.
- Each search may contain up to 3 `queries`, which MUST be variants of the same intent.
- For complex searches, MUST break down into step-by-step searches.
- Access multiple URLs from search results for comprehensive information or cross-validation.
- For image results, the tool automatically downloads all result images in full resolution and provides local file paths.

### Recommended Usage
- Use `info` to validate facts, discover relevant articles, or cross-check content.
- Use `image` for visual references, illustration sources, or user-requested image retrieval.
- Use `api` to find callable APIs and integrate them into code or workflows.
- Use `news` to retrieve breaking updates, current events, or recent announcements.
- Use `tool` to find apps, SaaS platforms, or plugins that can perform specific operations.
- Use `data` when the user needs downloadable data, statistics, or analytics sources.
- Use `research` to support academic, technical, or policy-related tasks with credible publications.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "queries": {
    "description": "Up to 3 query variants that express the same search intent",
    "type": "ARRAY",
    "items": { "type": "STRING" }
  },
  "time": {
    "description": "Optional time filter to limit results to a recent time range",
    "enum": ["all", "past_day", "past_week", "past_month", "past_year"],
    "type": "STRING"
  },
  "type": {
    "description": "The category of search to perform. Determines the source and format of expected results.",
    "enum": ["info", "image", "api", "news", "tool", "data", "research"],
    "type": "STRING"
  }
}
```

---

## 7. `schedule`

> **Description:** Schedule a task to run at a specific time or interval.

### Supported Types
- `cron`: Schedule based on cron expression for precise timing control.
- `interval`: Schedule based on time intervals for simple recurring tasks.

### Instructions
- This tool is primarily for scheduling task execution, not for setting reminders or alarms.
- Execution of `cron` tasks is based on the user's timezone.
- Minimum interval for recurring tasks is 1 hour (3600 seconds).
- Use `cron` with `repeat` set to true for recurring tasks based on a cron schedule.
- Use `interval` with `repeat` set to true for periodic tasks at fixed intervals.
- **Cron Expression Format (6-field):** `seconds(0-59) minutes(0-59) hours(0-23) day-of-month(1-31) month(1-12) day-of-week(0-6, 0=Sunday)`

### Recommended Usage
- Use this tool when the user requests a task to be scheduled for future execution.
- Use this tool when the user requests to repeat the current task at regular intervals.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "cron": {
    "description": "Standard 6-field cron expression specifying when to run the task. Required for `cron` type.",
    "type": "STRING"
  },
  "interval": {
    "description": "Time interval in seconds between executions. Required for `interval` type.",
    "type": "INTEGER"
  },
  "name": {
    "description": "Concise human-readable name of the task for easy identification",
    "type": "STRING"
  },
  "playbook": {
    "description": "Summary of process and best practices learned from the current task, to ensure repeatability and consistency when executing the scheduled task in the future. Optional and only used when the scheduled task is exactly the same as the current task.",
    "type": "STRING"
  },
  "prompt": {
    "description": "Natural language description of the task to perform at execution time. Phrase it as if executing immediately, without repeating scheduling details.",
    "type": "STRING"
  },
  "repeat": {
    "description": "Whether to repeat the task after execution. If false, the task runs only once.",
    "type": "BOOLEAN"
  },
  "type": {
    "description": "Type of schedule for the task",
    "enum": ["cron", "interval"],
    "type": "STRING"
  }
}
```

---

## 8. `expose`

> **Description:** Expose a local port in the sandbox for temporary public access.

### Instructions
- This tool returns a temporary public proxied domain for the specified port in the sandbox.
- Exposed services MUST NOT bind to specific IP addresses or Host headers.
- DO NOT use for production as services will become unavailable after sandbox shutdown.

### Recommended Usage
- Use for providing temporary public access for locally running services (e.g., a web server started with `shell:exec`).

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "port": {
    "description": "Local port number in the sandbox to expose for public access",
    "type": "INTEGER"
  }
}
```

---

## 9. `browser`

> **Description:** Navigate the browser to a specified URL to begin web browsing session.

### Intent Types
- `navigational`: For general browsing.
- `informational`: For reading contents of articles or documents.
- `transactional`: For performing actions like submitting forms or making purchases in web applications.

### Instructions
- Use this tool to start browser interactions and navigate to web pages.
- MUST use browser tools to access and interpret all URLs provided directly by the user.
- From search results, MUST access multiple URLs that appear relevant to the task.
- The browser maintains login state across tasks, MUST open the corresponding webpage first to check login status.

### Recommended Usage
- Use when URLs are provided directly by the user.
- Use to navigate to search results from search tools.
- Use to visit specific web pages for information gathering.
- Use to access web applications or services.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "focus": {
    "description": "(Required if intent is `informational`) Specific topic, section, or question to focus on when visiting the page. Helps guide reading and extraction efforts toward the most relevant content.",
    "type": "STRING"
  },
  "intent": {
    "description": "The purpose of visiting this URL. Helps to determine how to handle the page.",
    "enum": ["navigational", "informational", "transactional"],
    "type": "STRING"
  },
  "url": {
    "description": "The URL to navigate to. Must include protocol prefix (e.g., https:// or file://).",
    "type": "STRING"
  }
}
```

---

## 10. `generate`

> **Description:** Enter generation mode to create or edit images, videos, audio, and speech from text and media references.

### Instructions
- Use this tool to begin generation or editing operations.
- After entering generate mode, you'll have access to specific AI-powered generation tools.

### Recommended Usage
- Use for creating visual content (images, videos) from text descriptions.
- Use for generating audio content and speech from text.
- Use for editing and refining existing images.
- Use for creating assets for projects or applications.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  }
}
```

---

## 11. `slides`

> **Description:** Enter slides mode to handle presentation creation and adjustment.

### Instructions
- Use this tool to begin slides operations.
- MUST complete information gathering, data analysis, asset preparation, image generation, or other preparatory work **before** starting to write slides.
- Any format can be exported through the user interface after slide creation.

### Recommended Usage
- Use to create slide-based presentations.
- Use to build PPT/PPTX presentations with web technologies.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence preamble describing the purpose of this operation",
    "type": "STRING"
  },
  "slide_content_file_path": {
    "description": "Path to markdown file in sandbox containing the detailed slide content outline (e.g., /home/ubuntu/project_name/slide_content.md)",
    "type": "STRING"
  },
  "slide_count": {
    "description": "Total number of slides in the presentation",
    "type": "NUMBER"
  }
}
```

---

## 12. `webdev_init_project`

> **Description:** Initialize a new web development project with modern tooling and structure.

### Feature Presets
- `"web-static"`: Pure frontend scaffold (default if omitted).
- `"web-db-user"`: Full-stack scaffold with backend, database, and authentication.

### Instructions
- Always init project first before making detailed plans.
- Create scaffolding under `/home/ubuntu/{project_name}` with automated environment setup.
- Always init necessary features (static, server, db, user) based on user requirements.
- If the user needs external API integration (LLM, S3, Data, Voice Transcription, Image Generation), use `"web-db-user"` because static sites cannot securely handle API keys or server-side operations.

### Recommended Usage
- Starting new web applications, websites, or API backends that need production-ready defaults.

### Schema
```json
{
  "brief": {
    "description": "A one-sentence description of the project initialization purpose",
    "type": "STRING"
  },
  "description": {
    "description": "Description of the web project to be created (will be used as project description)",
    "type": "STRING"
  },
  "features": {
    "description": "Initial capability preset for the project.",
    "enum": ["web-static", "web-db-user"],
    "type": "STRING"
  },
  "project_name": {
    "description": "Name of the web project to be created (will be used as directory name)",
    "type": "STRING"
  },
  "project_title": {
    "description": "Title of the web project to be created (will be used as project title)",
    "type": "STRING"
  }
}
```
