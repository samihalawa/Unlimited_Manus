<template>
  <div class="conversation-list">
    <div class="list-header">
      <button class="new-chat-btn" type="button" @click="handleNewChat">
        <PlusOutlined />
        <span>New Chat</span>
      </button>
    </div>

    <div class="search-box">
      <div class="search-wrapper">
        <SearchOutlined class="search-icon" />
        <input
          v-model="searchTerm"
          class="search-input"
          type="text"
          placeholder="Search conversations"
          aria-label="Search conversations"
        />
        <button
          v-if="searchTerm"
          class="clear-button"
          type="button"
          @click="searchTerm = ''"
          aria-label="Clear search"
        >
          ×
        </button>
      </div>
    </div>

    <div class="conversation-items" v-if="filteredConversations.length">
      <button
        v-for="conversation in filteredConversations"
        :key="conversation.conversation_id"
        type="button"
        class="conversation-item"
        :class="{ active: String(conversation.conversation_id) === activeConversationId }"
        @click="handleSelectConversation(conversation)"
      >
        <div class="conversation-title">
          {{ formatTitle(conversation.title) }}
        </div>
        <div class="conversation-preview">
          {{ formatPreview(conversation?.latest_message?.content) }}
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">{{ formatUpdatedAt(conversation.update_at) }}</span>
          <span v-if="conversation.model_name" class="conversation-model">
            {{ conversation.model_name }}
          </span>
        </div>
      </button>
    </div>
    <div class="empty-state" v-else>
      <p class="empty-title">No conversations found</p>
      <p class="empty-subtitle">Try adjusting your search or start a new chat.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons-vue";
import { useChatStore } from "@/store/modules/chat";
import { formatTime } from "@/utils/time";

const chatStore = useChatStore();
const router = useRouter();
const { list, conversationId, agent, mode } = storeToRefs(chatStore);

const searchTerm = ref("");
const activeConversationId = computed(() => {
  const current = conversationId.value;
  if (current === null || current === undefined) {
    return null;
  }
  return String(current);
});

const filteredConversations = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) {
    return list.value;
  }
  return list.value.filter((conversation) => {
    const title = (conversation.title || "Untitled conversation").toLowerCase();
    const preview = (conversation?.latest_message?.content || "").toLowerCase();
    return title.includes(term) || preview.includes(term);
  });
});

const handleSelectConversation = (conversation) => {
  if (!conversation || String(conversation.conversation_id) === activeConversationId.value) {
    return;
  }

  chatStore.conversationId = conversation.conversation_id;
  chatStore.chat = conversation;
  chatStore.clearMessages();
  chatStore.initConversation(conversation.conversation_id);

  const targetAgentId = conversation.agent_id || agent.value?.id;

  if (mode.value === "chat") {
    router.push(`/lemon/chat/${conversation.conversation_id}`);
  } else if (targetAgentId) {
    router.push(`/lemon/${targetAgentId}/${conversation.conversation_id}`);
  } else {
    router.push(`/lemon/${conversation.conversation_id}`);
  }
};

const handleNewChat = () => {
  chatStore.conversationId = null;
  chatStore.chat = {};
  chatStore.clearMessages();

  if (mode.value === "chat") {
    router.push("/lemon/chat");
  } else if (agent.value?.id) {
    router.push(`/lemon/${agent.value.id}`);
  } else {
    router.push("/lemon");
  }
};

const formatTitle = (title) => {
  return title?.trim() || "Untitled conversation";
};

const formatPreview = (preview) => {
  if (!preview) {
    return "No messages yet";
  }
  const normalized = preview.replace(/\s+/g, " ").trim();
  return normalized.length > 80 ? `${normalized.slice(0, 80)}…` : normalized;
};

const formatUpdatedAt = (value) => {
  if (!value) {
    return "";
  }
  try {
    return formatTime(value);
  } catch (error) {
    console.warn("Failed to format time", error);
    return "";
  }
};
</script>

<style lang="scss" scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 280px;
  padding: 16px;
  background-color: var(--bg-secondary, #ffffff);
  border-right: 1px solid var(--border-primary, rgba(17, 24, 39, 0.08));
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.new-chat-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-primary, rgba(17, 24, 39, 0.08));
  background: var(--bg-primary, #f8f8f7);
  color: var(--text-primary, #111827);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    background: var(--bg-hover, #eaeaea);
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  :deep(.anticon) {
    font-size: 14px;
  }
}

.search-box {
  margin-bottom: 16px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary, #9ca3af);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border-radius: 12px;
  background: var(--bg-primary, #f8f8f7);
  border: 1px solid var(--border-primary, rgba(17, 24, 39, 0.08));
  font-size: 13px;
  color: var(--text-primary, #111827);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.4);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background: var(--bg-secondary, #ffffff);
  }

  &::placeholder {
    color: var(--text-tertiary, #9ca3af);
  }
}

.clear-button {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: var(--bg-hover, #eaeaea);
    color: var(--text-primary, #111827);
  }
}

.conversation-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  padding-right: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.4);
    border-radius: 6px;
  }
}

.conversation-item {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background-color: var(--bg-hover, #eaeaea);
    border-color: var(--border-primary, rgba(17, 24, 39, 0.08));
  }

  &.active {
    background-color: rgba(79, 70, 229, 0.08);
    border-color: rgba(79, 70, 229, 0.35);
  }
}

.conversation-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.conversation-preview {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.conversation-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
}

.conversation-model {
  padding-left: 8px;
  font-weight: 500;
}

.empty-state {
  margin-top: auto;
  text-align: center;
  padding: 48px 0;
  color: var(--text-secondary, #6b7280);

  .empty-title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .empty-subtitle {
    font-size: 13px;
  }
}

@media (max-width: 960px) {
  .conversation-list {
    display: none;
  }
}
</style>
