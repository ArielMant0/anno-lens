<template>
    <div class="d-flex align-center">
        <v-icon :icon="typeIcon" :size="size" class="mr-1"></v-icon>
        <v-chip
            closable
            :size="size"
            @click:close.prevent="emit('remove', entity)"
            @click="emit('click', entity)"
            density="compact">
            {{ entity.name ? entity.name : entity.data }}
        </v-chip>
    </div>
</template>

<script setup>
    import { Entity, ENTITY_TYPE } from '@/use/annotation/entity';

    const props = defineProps({
        entity: {
            type: Entity,
            required: true
        },
        size: {
            type: String,
            default: "small"
        }
    })

    const emit = defineEmits(["click", "remove"])

    const typeIcon = computed(() => {
        switch(props.entity.type) {
            case ENTITY_TYPE.ANNOTATION: return "mdi-note-edit-outline"
            case ENTITY_TYPE.DATAPOINT: return "mdi-circle"
            case ENTITY_TYPE.SELECTION: return "mdi-scatter"
            case ENTITY_TYPE.COLUMN: return "mdi-pillar"
        }
    })
</script>