<template>
    <v-sheet
        :style="{ maxWidth: maxw }"
        rounded
        class="mb-1 pa-1 text-caption"
        :data-target-type="ACTION_TARGET.ANNOTATION"
        :data-target-id="data.id"
        :data-target-anno="data._anno.id"
        :data-target-selections="data._anno.getSelectionIds().join(',')"
        >

        <div class="d-flex justify-space-between">
            <div>
                <v-icon size="small" :icon="sourceIcon"/>
                <v-icon size="small" class="ml-1" :icon="typeIcon"/>
            </div>
            <v-btn
                icon="mdi-close"
                density="compact"
                variant="plain"
                color="error"
                size="small"
                @click="data._anno.removeEntry(data.id)"
                />
        </div>

        <template v-if="data.type === ENTRY_TYPE.TEXT">
            <textarea v-if="showMarkdown"
                v-model="data.text"
                ref="editArea"
                style="width: 100%; border: thin solid lightgray; border-radius: 4px;"
                :rows="Math.floor(data.text.length / 65)"
                class="text-wrap pl-1 pr-1 anno-md"
                @blur="setShowMarkdown(false)"
                @change="data.update()"
                >
                {{ data.text }}
            </textarea>
            <div v-else v-html="markdown"
                class="anno-md"
                style="width: 95%"
                @click="setShowMarkdown(true)"
                >
            </div>
        </template>

        <div class="d-flex flex-wrap mt-1">
            <v-chip v-for="ent in data.entities"
                :key="ent.id"
                closable
                @click:close.prevent="data.removeEntity(ent.id)"
                class="mr-1 mb-1"
                size="small"
                density="compact">
                {{ ent.data }}
            </v-chip>
        </div>
    </v-sheet>
</template>

<script setup>
    import { marked } from 'marked';
    import { ACTION_TARGET } from '@/use/annotation/action-target';
    import { ENTRY_SOURCE, ENTRY_TYPE, TextEntry } from '@/use/annotation/annotation-entry';
    import { computed, onMounted, useTemplateRef, watch } from 'vue';

    const props = defineProps({
        data: {
            type: [TextEntry],
            required: true
        },
        maxWidth: {
            type: [Number, String],
            default: "auto"
        },
        maxLength: {
            type: Number,
            default: 0
        }
    })

    const editArea = useTemplateRef("editArea")

    const maxw = computed(() => typeof props.maxWidth === "number" ? props.maxWidth+'px' : props.maxWidth)
    const sourceIcon = computed(() => props.data.source === ENTRY_SOURCE.AI ? "mdi-robot-happy" : "mdi-account")
    const typeIcon = computed(() => {
        switch(props.data.type) {
            default:
            case ENTRY_TYPE.TEXT: return "mdi-format-text"
            case ENTRY_TYPE.VIS: return "mdi-chart-bar"
        }
    })

    const showMarkdown = ref(false)
    const markdown = ref("")

    function convertMarkdown() {
        const truncate = props.maxLength > 0 && props.data.text.length > props.maxLength
        markdown.value = marked.parse(truncate ?
            props.data.text.slice(0, props.maxLength)+"..." :
            props.data.text
        )
    }

    function setShowMarkdown(value) {
        showMarkdown.value = value
    }

    onMounted(convertMarkdown)

    watch(editArea, function() {
        if (editArea.value) {
            editArea.value.focus()
        }
    })

    watch(() => props.data.timeUpdated, convertMarkdown)
</script>

<style>
.anno-md ul {
    padding-left: 12px;
    list-style-type: disc;
}
.anno-md ol {
    padding-left: 12px;
    list-style-type: upper-greek;
}
</style>