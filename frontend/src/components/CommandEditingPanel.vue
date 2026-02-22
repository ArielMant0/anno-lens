<template>
    <v-card v-if="data.prompt" id="command-panel" density="compact" :style="{ maxWidth: maxW }">
        <v-card-text>
            <div class="text-caption">
                <b>{{ numActiveTargets }}</b> / <b>{{ data.cmd.minTargets }}</b> targets (max <b>{{ data.cmd.maxTargets }}</b>)
            </div>
            <PromptPanel :prompt="data.prompt"/>
        </v-card-text>
        <v-card-actions>
            <v-btn color="warning" @click="cancel">cancel</v-btn>
            <v-btn color="success" @click="submit" :disabled="!minReached || maxReached">submit</v-btn>
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

    const { activeMapping, hasActive, numActiveTargets } = storeToRefs(controls)

    const props = defineProps({
        maxWidth: {
            type: [String, Number],
            default: "500px"
        }
    })
    const maxW = computed(() => props.maxWidth + (typeof props.maxWidth === "string" ? "" : "px"))

    const data = reactive({ prompt: null, cmd: null })
    const minReached = computed(() => data.prompt ? numActiveTargets.value >= data.cmd.minTargets : true)
    const maxReached = computed(() => data.prompt ? numActiveTargets.value > data.cmd.maxTargets : true)

    function cancel() {
        controls.cancelActive()
    }

    function submit() {
        controls.executeActive()
    }

    watch(hasActive, function(value) {
        if (value) {
            const cmd = activeMapping.value.command
            if (cmd instanceof LLMCommand ) {
                data.cmd = cmd
                data.prompt = cmd.promptTemplate
            } else {
                data.prompt = null
                data.cmd = null
            }
        } else {
            data.prompt = null
            data.cmd = null
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