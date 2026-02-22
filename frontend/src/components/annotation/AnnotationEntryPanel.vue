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

        <textarea v-if="data.type === ENTRY_TYPE.TEXT"
            v-model="data.text"
            style="width: 100%;"
            class="text-wrap">
            {{ data.text }}
        </textarea>

        <div class="d-flex flex-wrap">
            <v-chip v-for="ent in data.entities"
                closable
                @click:close="data.removeEntity(ent.id)"
                class="mr-1 mb-1"
                size="small"
                density="compact">
                {{ ent.id }}
            </v-chip>
        </div>
    </v-sheet>
</template>

<script setup>
    import { ACTION_TARGET } from '@/use/annotation/action-target';
    import { ENTRY_SOURCE, ENTRY_TYPE, TextEntry } from '@/use/annotation/annotation-entry';
    import { computed } from 'vue';

    const props = defineProps({
        data: {
            type: [TextEntry],
            required: true
        },
        maxWidth: {
            type: [Number, String],
            default: "auto"
        }
    })

    const maxw = computed(() => typeof props.maxWidth === "number" ? props.maxWidth+'px' : props.maxWidth)
    const sourceIcon = computed(() => props.data.source === ENTRY_SOURCE.AI ? "mdi-robot-happy" : "mdi-account")
    const typeIcon = computed(() => {
        switch(props.data.type) {
            default:
            case ENTRY_TYPE.TEXT: return "mdi-format-text"
            case ENTRY_TYPE.VIS: return "mdi-chart-bar"
        }
    })
</script>