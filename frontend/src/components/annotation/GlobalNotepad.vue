<template>
    <v-sheet rounded elevation="2" min-height="100" style="width: 100%;">

        <div v-for="anno in annos" :key="anno.id+'_'+anno.timeUpdated" class="pa-1 pt-2">
            <div >
                <AnnotationTitle
                    v-model="anno.label"
                    :size="anno.data.size"
                    class="ml-2"
                    :data-target-type="ACTION_TARGET.SELECTION"
                    :data-target-selections="anno.getSelectionIds().join(',')"
                    :data-target-id="anno.id"
                    :data-target-anno="anno.id"
                    />
            </div>

            <AnnotationEntryPanel v-for="e in anno.entries" :key="e.id.id+'_'+e.timeUpdated" :data="e"/>
        </div>

        <div v-if="llmLoading" class="d-flex align-center justify-center">
            <v-progress-circular size="32" indeterminate></v-progress-circular>
        </div>
    </v-sheet>
</template>

<script setup>
    import { useApp } from '@/stores/app';
    import { storeToRefs } from 'pinia';
    import DM from '@/use/data-manager';
    import { onMounted, ref, watch } from 'vue';
    import AnnotationEntryPanel from './AnnotationEntryPanel.vue';
    import { ACTION_TARGET } from '@/use/annotation/action-target';
    import AnnotationTitle from './AnnotationTitle.vue';

    const app = useApp()
    const { selectionTime, annoTime, llmLoading } = storeToRefs(app)

    const annos = ref([])

    // read the current annotation (if there is one)
    function readAnnotations() {
        annos.value = DM.getMatchingAnnotations()
    }

    onMounted(readAnnotations)

    watch(selectionTime, readAnnotations)
    watch(annoTime, readAnnotations)
</script>