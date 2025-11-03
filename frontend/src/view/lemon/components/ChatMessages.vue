<template>
  <div class="chat-messages">
    <div class="message-list">
      <!-- 自动判断是否显示骨架屏 -->
      <div v-if="isLoading">
        <a-skeleton v-for="n in 5" :key="n" active title paragraph="{ rows: 10 }" class="skeleton-message" />
      </div>

      <!-- 正常消息渲染 -->
      <template v-else-if="mode === 'task'">
        <div v-for="message in messages" :key="message.id" class="message-item" :class="message.role">
          <div style="display: flex; align-items: center; justify-content: flex-end" v-if="message?.meta?.screenshot || message?.meta?.json?.screenshot">
            <ChatReference :meta="message?.meta?.json || message?.meta" />
          </div>
          <div class="message-options" v-if="!isPlanOrUpdateStatus(message)">
            <div v-if="message.role === 'assistant'" class="message-title">
              <img src="@/assets/image/lemon.jpg" alt="" />
              <!-- LemonAI -->
            </div>
            <div v-else></div>

            <div class="message-actions" v-if="message.role === 'user'">
              <div class="message-time" v-if="message.timestamp">
                {{ formatTimeWithHMS(message.timestamp, t) }}
              </div>
              <div class="action-buttons">
                <div class="action-btn" @click="copyMessage(message)" title="Copy">
                  <CopyOutlined />
                </div>
                <div class="action-btn" @click="editMessage(message)" title="Edit">
                  <EditOutlined />
                </div>
                <div class="action-btn delete-btn" @click="deleteMessage(message)" title="Delete">
                  <DeleteOutlined />
                </div>
              </div>
            </div>
          </div>
          <Message :message="message" />
        </div>
      </template>

      <!-- chat 模式 -->
      <div v-else-if="mode === 'chat'">
        <ChatTree :messages="messages" />
      </div>
    </div>

    <!-- Token consumption display -->
    <div v-if="tokenCount && tokenCount.total > 0" class="token-consumption">
      <a-tag>
        <span v-if="chatStore.chat.model_name">Model: {{ chatStore.chat.model_name }}</span>
        <span>Tokens: {{ tokenCount.total }}</span>
        <span><ArrowUpOutlined /> {{ tokenCount.input_tokens }}</span>
        <span><ArrowDownOutlined /> {{ tokenCount.output_tokens }}</span>
      </a-tag>
    </div>
  </div>
</template>

<script setup>
import Message from "../message/index.vue";
import ChatTree from "./ChatTree.vue";
import { CopyOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons-vue";
import { message as messageUtil, Modal } from "ant-design-vue";
import { useChatStore } from "@/store/modules/chat";
import { useI18n } from "vue-i18n";
import { onMounted, computed, ref } from "vue";
import { formatTimeWithHMS } from "@/utils/time";
import ChatReference from "./ChatReference.vue";

const { t } = useI18n();
const chatStore = useChatStore();

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: "task",
  },
});
const isTimedOut = ref(false);
// 自动判断是否加载中
const isLoading = computed(() => {
  return props.mode === "task" && props.messages.length === 0 && !isTimedOut.value;
});

const tokenCount = computed(() => {
  const { input_tokens = 0, output_tokens = 0 } = chatStore.chat || {};
  return {
    input_tokens,
    output_tokens,
    total: input_tokens + output_tokens,
  };
});

const isPlanOrUpdateStatus = (message) => {
  return ["plan", "update_status", "stop", "error", "coding", "progress"].includes(message.meta?.action_type);
};

const copyMessage = (message) => {
  navigator.clipboard
    .writeText(message.content)
    .then(() => {
      messageUtil.success(t("lemon.message.copySuccess"));
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      messageUtil.error(t("lemon.message.copyError"));
    });
};

const editMessage = (message) => {
  messageUtil.info("Edit message feature coming soon");
};

const deleteMessage = (message) => {
  Modal.confirm({
    title: "Delete Message",
    content: "Are you sure you want to delete this message?",
    okText: "Delete",
    cancelText: "Cancel",
    okButtonProps: { danger: true },
    onOk() {
      chatStore.deleteMessage(message.id);
      messageUtil.success("Message deleted");
    },
  });
};

onMounted(() => {
  const chatMessages = document.querySelector(".chat-messages");
  if (!chatMessages) return;
  setTimeout(() => {
    isTimedOut.value = true;
  }, 5000); // 5秒
  let debounceTimer;
  const handleScroll = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight <= 5;
      chatStore.isScrolledToBottom = isNearBottom;
    }, 100);
  };

  chatMessages.addEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
.message-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;

  img {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  height: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 174px;
}

.chat-messages::-webkit-scrollbar {
  display: none;
}

.message-list {
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  flex-direction: column !important;
  gap: 2px;

  &.assistant {
    align-self: flex-start;
    width: 100%;
  }

  &.user {
    width: 100%;
    align-self: flex-end;
    align-items: flex-end;
    .message-content {
      background: #fff;
      border: 1px solid #0000000f;
      border-radius: 12px;
      color: #34322d;
      font-size: 16px;
      width: fit-content;
      max-width: 100%;
    }
  }

  &:hover {
    .message-actions {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
  }
}

.message-options {
  display: flex;
  flex-direction: row;
  color: #858481;
  font-size: 12px;
  align-items: center;
  gap: 2px;
  padding: 0px 12px;
  justify-content: space-between;
  height: 24px;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.message-time {
  font-size: 12px;
  color: var(--text-tertiary, #999);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background-color: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-primary, rgba(17, 24, 39, 0.08));
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    background-color: var(--bg-hover, #eaeaea);
    color: var(--text-primary, #000);
    transform: translateY(-1px);
  }
}

.delete-btn:hover {
  background-color: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.token-consumption {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: #858481;
  background-color: #f9f9f9;
  margin: 8px 0;
}

:deep(.token-consumption .ant-tag) {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  font-family: "Courier New", Courier, monospace;
}

.skeleton-message {
  margin-bottom: 16px;
}

.reference {
  border: 1px solid #0000000f;
  border-radius: 8px;
  padding: 10px;
  display: inline-block;
  margin-bottom: 8px;
  max-width: 80%;
}
</style>
