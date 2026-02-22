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
                    :color="CM.getColor(i+4)"
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
                minHeight: minh,
                maxHeight: maxh,
                fontSize: '12px',
                minWidth: w,
                maxWidth: w,
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
                    :data-target-type="ACTION_TARGET.DATA"
                    :data-target-id="data.id"
                    :data-target-anno="data.id"
                    :data-target-selections="data.getSelectionIds().join(',')"
                    :style="{ maxWidth: (w-15)+'px', fontWeight: 'bold' }">
                    {{ data.label }}
                </div>

            </div>

            <AnnotationEntryPanel v-for="entry in data.entries"
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
                    :color="CM.getColor(i+4)"
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
    import DM from '@/use/data-manager';
    import AnnotationEntryPanel from './AnnotationEntryPanel.vue';
    import { computed } from 'vue';
    import { ACTION_TARGET } from '@/use/annotation/action-target';
    import CM from '@/use/command-manager';

    const props = defineProps({
        data: {
            type: Annotation,
            required: true
        },
        side: {
            type: String,
            default: ""
        },
        selected: {
            type: Boolean,
            default: false
        },
        minHeight: {
            type: [String, Number],
            default: "auto"
        },
        maxHeight: {
            type: [String, Number],
            default: "auto"
        },
        width: {
            type: Number,
            default: 200
        },
    })

    const controls = useControls()

    const minh = computed(() => props.minHeight + (typeof props.minHeight === "string" ? "" : "px"))
    const maxh = computed(() => props.maxHeight + (typeof props.maxHeight === "string" ? "" : "px"))
    const w = computed(() => props.width + "px")

</script>

<style scoped>
.anno-container:not(:hover) .del-anno,
.anno-container:not(:hover) .add-anno {
    visibility: hidden;
}
</style>