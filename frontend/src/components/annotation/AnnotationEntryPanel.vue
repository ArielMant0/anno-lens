<template>
    <v-sheet
        :style="{ maxWidth: maxw }"
        rounded
        border
        class="ma-1 pa-2 text-caption"
        :data-target-type="ACTION_TARGET.ANNOTATION"
        :data-target-id="data.id"
        >

        <v-btn
            icon="mdi-close"
            density="compact"
            variant="plain"
            color="error"
            size="small"
            style="float: right;"
            @click="emit('remove', data.id)"/>

        <p v-if="data.type === ENTRY_TYPE.TEXT" class="text-wrap">{{ data.text }}</p>

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
    import { ENTRY_TYPE, TextEntry } from '@/use/annotation/annotation-entry';
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

    const emit = defineEmits(["remove"])
</script>