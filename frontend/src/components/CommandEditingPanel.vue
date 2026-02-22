<template>
    <v-card v-if="data.prompt" id="command-panel" density="compact" :style="{ maxWidth: maxW }">
        <v-card-text>
            <PromptPanel :prompt="data.prompt"/>
        </v-card-text>
        <v-card-actions>
            <v-btn color="warning" @click="cancel">cancel</v-btn>
            <v-btn color="success" @click="submit">submit</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup>
    import { useControls } from '@/stores/controls';
    import { storeToRefs } from 'pinia';
    import PromptPanel from './PromptPanel.vue';
    import { computed, reactive, watch } from 'vue';
    import { LLMCommand } from '@/use/commands';

    const controls = useControls()

    const { activeMapping, hasActive } = storeToRefs(controls)

    const props = defineProps({
        maxWidth: {
            type: [String, Number],
            default: "400px"
        }
    })
    const maxW = computed(() => props.maxWidth + (typeof props.maxWidth === "string" ? "" : "px"))

    const data = reactive({ prompt: null })

    function cancel() {
        controls.cancelActive()
    }

    function submit() {
        controls.executeActive()
    }

    watch(hasActive, function(value) {
        if (value) {
            const cmd = activeMapping.value.command
            if (cmd instanceof LLMCommand) {
                data.prompt = cmd instanceof LLMCommand ? cmd.promptTemplate : null
            }
        } else {
            data.prompt = null
        }
    })

</script>

<style scoped>
#command-panel {
    position: fixed;
    left: 15px;
    bottom: 10px;
    z-index: 5999;
}
</style>