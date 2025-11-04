# Navigation Audit (work in progress)

> Snapshot generated while executing Plan Step&nbsp;2 (“Audit UI navigation and tools”). Content will be iteratively expanded and refined as additional views are reviewed and behaviours are verified in the running app.

## Route Matrix (from `frontend/src/router/index.js`)
- `/` → redirects to `/lemon`
- `/lemon/:agentId?/:id?` → `view/lemon/components/ChatPanel.vue`
- `/share/:id?` → `view/share/index.vue`
- `/auth` → `view/auth/index.vue`
- `/auth/google` → `view/auth/GoogleCallback.vue`
- `/demo` → `view/demo/index.vue`
- `/pricing` → `view/pay/pricing.vue`
- `/pay/success` → `view/pay/paySuccess.vue`
- `/desktop/redirect` → `view/desktop/redirect.vue`
- `/setting/*` (nested: `basic`, `default-model`, `default-model-setting`, `model-service`, `search-service`, `mcp-service`, `about`, `usage`, `profile`)

## `/lemon/:agentId?/:id?`
- **Primary layout** (`view/lemon/components/ChatPanel.vue`):
  - Left column: `ConversationList` (`ConversationList.vue`) with buttons `New Chat`, per-conversation entries, and search bar.
  - Center: `ChatHeader`, `PhaseDisplay`, `ChatMessages`, `ChatInput`, scroll-to-bottom chip.
  - Right column: `Preview` and `LocalPreview` panes.
- **Sidebar / global menu** (`view/menu/index.vue`):
  - `New Agent` button → `changeMode('task')`; clears stored agent context and pushes `/lemon`. Label implies agent creation but implementation currently resets mode (needs UX review).
  - `Agent Store` button → `window.open('https://app.lemonai.ai/store')`; no in-app navigation.
  - `AgentList` component renders agent cards with contextual `⋯` menu (`Edit`, `Experience`, `Delete`) and a global search modal.
  - Footer social buttons (theme toggle, homepage, email, Discord, documentation) are `<a>` links.
- **Conversation list** (`ConversationList.vue`):
  - `New Chat` button → resets conversation, pushes `/lemon` with/without agent id.
  - Search input + clear control.
  - Conversation items clickable; highlight active conversation.
- **Chat header** (`ChatHeader.vue`):
  - `Search Files` icon triggers `file-explorer-visible` emitter.
  - `NotificationCenter` entry.
  - `More` menu exposes `Rename` modal; other actions currently hidden/commented.
- **Chat input** (`ChatInput.vue`):
  - Extensive control set (file upload, model select, work-mode selector, MCP dropdown, run button, etc.). `handleModeChange` now synchronises `chatStore.mode` (`auto/agent` → task, `chat` → chat) and routes accordingly; still need to verify runtime behaviour for each mode and ensure stop/run UX is consistent.
- **Observations / gaps recorded so far**
  - `Sidebar.vue` exists but is not referenced; confirm whether legacy component should be removed or integrated.
  - Mode switcher in `ChatInput.vue` logs the change without driving different execution flows (`handleModeChange`).
  - Need clarity on intended navigation for `/lemon/<agentId>` vs `/lemon/<conversationId>`; current router push logic varies between menu and conversation list.

## `/share/:id?`
- Shares read-only conversation (`view/share/index.vue`).
- Buttons: floating `scroll-to-bottom`, footer `Replay`/`Jump to result`.
- Uses same `ChatHeader` and `ChatMessages` as primary view; `More` menu intentionally hidden via scoped styles.

## `/pricing`
- Wrapper (`view/pay/pricing.vue`) with back button to `name: 'lemon'` and embedded `Pricing` component. Needs audit of `Pricing.vue` for button behaviours (purchase flows, payment option selection).
- `Pricing.vue` highlights: segmented control for billing cadence, dynamic plan cards with `Subscribe` buttons, downgrade/cancel modals, QR-code payments, Stripe/WeChat payment option buttons.
- Outstanding questions: verify `pay(plan)` implementation in `pricing.vue` matches Manus tool expectations (e.g., should trigger `message.ask`?); confirm membership state updates propagate back to header/menus.

## `/setting/*`
- Shell view (`view/setting/index.vue`) with back button, left nav (`MenuSide.vue`), and routed content panes.
- Each sub-view contains multiple controls (API key forms, toggles, table/list entries) that need individual verification in later passes.
- `MenuSide.vue` builds menu dynamically based on authenticated user; `handleMenuClick` emits events and routes to `/setting/<key>`. Need to ensure active-class logic matches nested routes (currently `endsWith(item.key)`).
- Sub-views to audit:
  - `basic.vue`: profile info, locale/theme toggles, logout.
  - `model.vue` (`model-service`): model provider cards with enable/disable switches and credential forms.
  - `search.vue` (`search-service`): search provider configuration.
  - `mcp.vue` (`mcp-service`): MCP server list, add/edit/delete flows.
  - `default-model.vue` / `defaultModelSetting.vue`: defaults per mode; confirm active path usage.
  - `about.vue`: update checks, release links.
  - `usage.vue`: quota tables/list (needs data display audit).
  - `auth/UserProfile.vue`: account settings modal triggered elsewhere.

## `/agents`
- Sidebar agent inventory used inside `menu/index.vue`.
- Buttons/controls: global search modal trigger, per-agent context menu (`Edit`, `Experience`, `Delete`), `AgentsEdit` modal, `KnowledgeModal`.
- Requires validation of deletion flow, modal persistence, and whether selections synchronize with chat store.

## Pending Detailed Audits
- `ChatMessages.vue`, `Message` subcomponents (`message/Message.vue`, `message/Planing.vue`, etc.) for observation rendering.
- All `/setting` sub-views, `/pricing` component tree, `/pay/success`, `/demo`, `/auth` flows.
- Backend parity for tool outputs feeding the UI (plan/message meta shape).

---

Next actions for Step&nbsp;2:
1. Deep-dive each remaining route/component to enumerate buttons and data displays.
2. Start building the requested button/data table with row numbering and status fields.
3. Cross-reference intended behaviours with actual store/service logic and note mismatches for remediation in Step&nbsp;3.
