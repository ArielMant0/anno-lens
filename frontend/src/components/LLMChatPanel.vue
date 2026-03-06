<template>
    <v-card density="compact" style="width: 97%; max-width: 100%">
        <div
            ref="wrapper"
            :style="{ maxWidth: maxw }"
            style="min-height: 10px; max-height: 20vh; overflow-y: auto;"
            :key="'up_'+chatTime"
            >
            <ChatEntry v-for="entry in history"
                :key="entry.id"
                :entry="entry"
                class="ml-1 mr-1 mt-2 mb-2"
                />
        </div>

        <ChatInput :disabled="llmLoading" class="ma-1" @submit="askModel"/>
    </v-card>
</template>

<script setup>
    import CHAT, { CHAT_ENTRY_TYPE } from '@/use/llm-chat';
    import { computed, onMounted, useTemplateRef } from 'vue';
    import ChatEntry from './entrypanels/ChatEntry.vue';
    import ChatInput from './ChatInput.vue';
    import { storeToRefs } from 'pinia';
    import { useApp } from '@/stores/app';
    import { llmFreeWithData } from '@/use/llm-interface';
    import { parseEntities } from '@/use/util';
    import DM from '@/use/data-manager';

    const app = useApp()
    const { llmLoading, chatTime } = storeToRefs(app)

    const props = defineProps({
        maxWidth: { type: [String, Number], default: "100%" }
    })

    const maxw = computed(() => props.maxWidth + (typeof props.maxWidth === "string" ? "" : "px"))

    const history = ref([])
    const wrapper = useTemplateRef("wrapper")

    function readChat() {
        history.value = CHAT.getHistory()
        const rect = wrapper.value.getBoundingClientRect()
        wrapper.value.scrollTo(0, rect.bottom, { behavior: "smooth" })
    }

    async function askModel(text) {
        try {
            const response = await llmFreeWithData(
                text,
                DM.describeDataStats()
            )
            const entities = parseEntities(response)

            CHAT.addEntry(
                CHAT_ENTRY_TYPE.AI,
                response.answer,
                entities
            )
        } catch (e) {
            console.error(e)
        }
    }

    onMounted(readChat)

    watch(chatTime, readChat)
</script>