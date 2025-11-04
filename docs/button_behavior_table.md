# Button & Data Display Audit (initial scaffold)

| # | Route/View | Element | Intended Function | Observed Implementation | Status | Notes |
| 1 | `/lemon` / `menu/index.vue` | `New Agent` (div.menu-button@changeMode) | Spawn a fresh agent creation workflow | Calls `changeMode('task')`, clears current agent, routes to `/lemon` without prompting for agent details | needs_fix | Label/behaviour mismatch; should either open agent creation modal or relabel as “Task Mode” |
| 2 | `/lemon` / `menu/index.vue` | `Agent Store` (div.menu-button@toStore) | Open agent store catalog | `window.open('https://app.lemonai.ai/store')` in new tab | ok | Validate if Manus parity expects in-app navigation instead of external tab |
| 3 | `/lemon` / `ConversationList.vue` | `New Chat` button | Start empty conversation scoped to current mode | Resets store conversationId/chat, routes to `/lemon` (or `/lemon/chat`) | unknown | Need runtime verification; ensure draft state cleared and welcome screen shows |
| 4 | `/lemon` / `ConversationList.vue` | Conversation list (data display) | Show user conversations with title, preview, timestamp, model badge | Iterates `list` from store, renders button per conversation with formatters | unknown | Confirm ordering, empty state copy, and model badge visibility against Manus |
| 5 | `/lemon` / `ChatInput.vue` | Work mode selector (`handleModeChange`) | Switch between auto/agent/chat workflows and sync conversation mode | Updates `workMode`, re-inits `chatStore` for task vs chat, routes accordingly | unknown | Needs end-to-end validation to confirm chat history resets and agent prompts behave as expected |
| 6 | `/lemon` / `ChatHeader.vue` | Search files button (`handleFileExplorer`) | Open file explorer side panel | Emits `file-explorer-visible` to global emitter | unknown | Verify event opens preview pane and matches Manus behaviour |
| 7 | `/lemon` / `ChatHeader.vue` | More → Rename (`handleEditName`) | Rename conversation title | Opens modal, calls `chatStore.updateConversationTitle` | unknown | Ensure rename propagates to list and persists server-side |

> Rows will be populated progressively as each view is inspected. Status codes to be used:
> - `unknown` — not yet verified
> - `needs_fix` — behaviour diverges from intent
> - `ok` — behaviour matches intent
> 
> After each batch of fixes we will compute the percentage of `ok` entries and append summary checkpoints here.

Current checkpoint: 1/7 rows verified as `ok` → **14 %** complete.
