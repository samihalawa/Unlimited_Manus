# LemonAI Application Sitemap (initial draft)

| Path | Primary Component(s) | Purpose | Key Navigation / Buttons | Notes |
|------|----------------------|---------|--------------------------|-------|
| `/` → `/lemon` | `view/lemon/index.vue` (wraps Sidebar + ChatPanel) | Root entry point for agent workspace | Depends on nested route `/lemon/:agentId?/:id?` | Sidebar handles mode switching and global navigation |
| `/lemon/:agentId?/:id?` | `ChatPanel.vue`, `ConversationList.vue`, `ChatHeader.vue`, `ChatMessages.vue`, `ChatInput.vue`, preview panes | Core agent/chat experience | Sidebar: `New Agent`, `Agent Store`, agent list with context menu; Conversation list: `New Chat`, search, conversation items; Chat header: file search, notifications, rename; Chat input: work mode selector, model select, MCP dropdown, MCP menu, send/stop buttons | Work mode selector now synchronizes with `chatStore` (`auto/agent` → task conversations, `chat` → tree chat). MCP and visibility controls require further validation. |
| `/share/:id?` | `view/share/index.vue` | Read-only playback of conversation | Footer `Replay` / `Jump to result`, scroll-to-bottom chip | Reuses `ChatHeader` + `ChatMessages`, hides share menu actions |
| `/auth` | `view/auth/index.vue` + child components (`login`, `register`, `sms-login`, `forgot`) | Authentication flows | Form submit buttons, mode tabs, social login triggers | Needs thorough audit per subcomponent |
| `/auth/google` | `GoogleCallback.vue` | OAuth callback | Auto-handles token exchange | No buttons |
| `/demo` | `view/demo/index.vue` | WebSocket demo page | None (auto connects) | For dev/testing only |
| `/pricing` | `view/pay/pricing.vue` + `components/pricing.vue` | Subscription and credits purchase | Billing cadence segmented control, plan `Subscribe` buttons, cancel/downgrade modals, payment option cards (Stripe/WeChat) | Ensure `pay(plan)` integrates with Manus message tool & handles plan states |
| `/pay/success` | `view/pay/paySuccess.vue` | Payment confirmation | CTA to return to app | Buttons to view usage/wallet (pending audit) |
| `/desktop/redirect` | `view/desktop/redirect.vue` | Desktop client deeplink | `Open App` button fallback | Should confirm redirect URL |
| `/setting/basic` | `setting/index.vue` + `basic.vue` | Profile & basic preferences | Back bar, profile form controls, locale/theme toggles | `MenuSide.vue` drives navigation for all `/setting/*` routes |
| `/setting/default-model` (legacy) | `default-model.vue` | Default model configuration (legacy) | Model selector, save button | Verify actual routing (current menu hides this entry) |
| `/setting/default-model-setting` | `defaultModelSetting.vue` | Default model per mode | Model dropdowns, save/apply | Ensure matches Manus requirement for default planning model |
| `/setting/model-service` | `model.vue` | Provider configuration | Enable/disable toggles, credential inputs, test buttons | Needs validation for provider metadata |
| `/setting/search-service` | `search.vue` | Search provider configuration | Add/Edit search providers | Confirm mapping to Manus search tool schema |
| `/setting/mcp-service` | `mcp.vue` | MCP server management | Add server modal, toggle activation, delete | Ensure list sync with ChatInput MCP dropdown |
| `/setting/about` | `about.vue` | Version info & updates | `Check update`, `View` documentation buttons | Update modal still contains TODO for release notes |
| `/setting/usage` | `usage.vue` | Usage/quota reporting | Tables (points/consumption) | Verify API integration |
| `/setting/profile` | `auth/UserProfile.vue` | Account details | Save profile, change password, logout | Triggered from sidebar profile hover |
| `/agents` (embedded) | `view/agents/index.vue`, `agentsEdit.vue`, `KnowledgeModal.vue` | Agent management (sidebar) | `Edit`, `Experience`, `Delete`, search modal, new agent modal | Integrated inside sidebar panel; `toggleCollapse` controls second menu visibility |
| `/editor/*` | `view/editor/index.vue` and nested render components | Rich document editor | Toolbar actions, media modals, version panel | Requires dedicated audit; interacts with `ChatInput` selection preview |
| `/menu` (embedded) | `view/menu/index.vue`, `secondMenu.vue` | Main navigation shell | Mode toggle (`New Agent`), `Agent Store`, agent list, theme toggle, external links | `toggleMobileMenu` event controls responsive behaviour |
| `/share` resources | `Preview` & `LocalPreview` components | File previews | Terminals & file explorer toggled via emitters | Shared with main chat |

> This sitemap will be revised as deeper audits cover remaining views (e.g., `/setting` sub-pages, `/editor` flows).

