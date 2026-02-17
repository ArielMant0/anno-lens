<template>
    <div class="d-flex align-center anno-container">

        <div v-if="side === 'left'">
            <div>
                <v-btn
                    class="del-anno"
                    color="error"
                    variant="text"
                    rounded="sm"
                    size="sm"
                    icon="mdi-delete"
                    density="compact"
                    @click="DM.removeAnnotation(data.id)"/>
            </div>

            <div v-for="i in 5">
                <v-btn
                    class="add-anno"
                    :color="controls.getColor(i+4)"
                    variant="text"
                    rounded="sm"
                    size="sm"
                    icon="mdi-plus"
                    density="compact"/>
            </div>
        </div>

        <div
            class="ma-1 pa-1"
            :style="{
                border: (selected ? 2 : 1) + 'px solid black',
                borderRadius: '4px',
                opacity: selected ? 1 : 0.75,
                overflowX: 'hidden',
                overflowY: 'auto',
                minHeight: minHeight+'px',
                maxHeight: maxHeight+'px',
                fontSize: '12px',
                minWidth: padding+'px',
                maxWidth: padding+'px',
            }">

            <div class="d-flex">
                <v-btn
                    color="error"
                    variant="text"
                    rounded="sm"
                    size="sm"
                    icon="mdi-close"
                    density="compact"/>

                <div
                    class="text-dots cursor-pointer"
                    :style="{ maxWidth: (padding-15)+'px', fontWeight: 'bold' }">
                    {{ data.label }}
                </div>

            </div>

            <AnnotationEntry v-for="entry in data.entries"
                :key="entry.id"
                :data="entry"
                @remove="data.removeEntry(entry.id)"
                />
        </div>

        <div v-if="side === 'right'">
            <div>
                <v-btn
                    class="del-anno"
                    color="error"
                    variant="text"
                    rounded="sm"
                    size="sm"
                    icon="mdi-delete"
                    density="compact"
                    @click="DM.removeAnnotation(data.id)"/>
            </div>

            <div v-for="i in 5">
                <v-btn
                    class="add-anno"
                    :color="controls.getColor(i+4)"
                    variant="text"
                    rounded="sm"
                    size="sm"
                    icon="mdi-plus"
                    density="compact"/>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { useControls } from '@/stores/controls';
    import Annotation from '@/use/annotation/annotation';
    import { ENTRY_TYPE } from '@/use/annotation/annotation-entry';
    import DM from '@/use/data-manager';
import AnnotationEntry from './AnnotationEntry.vue';

    const props = defineProps({
        data: {
            type: Annotation,
            required: true
        },
        side: {
            type: String,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        },
        minHeight: {
            type: Number,
            default: 120
        },
        maxHeight: {
            type: Number,
            default: 120
        },
        padding: {
            type: Number,
            default: 4
        },
    })

    const controls = useControls()

</script>

<style scoped>
.anno-container:not(:hover) .del-anno,
.anno-container:not(:hover) .add-anno {
    visibility: hidden;
}
</style>